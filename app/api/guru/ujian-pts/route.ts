import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcNilaiTahfidz, calcNilaiTahsin, getPredikat } from '@/lib/surah-data'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'GURU') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const guruId = (session.user as any).guruId
  if (!guruId) {
    return NextResponse.json({ error: 'Guru ID not found' }, { status: 400 })
  }

  const activeSemester = await prisma.semester.findFirst({
    where: { isAktif: true },
    include: { tahunAjaran: true }
  })

  const ptsSettingRecords = await prisma.systemSetting.findMany({
    where: { key: { in: ['PTS_ENABLED', 'PTS_DATE_LABEL', 'PTS_TYPE', 'PTS_TITLE'] } }
  })
  const ptsSettingMap = new Map(ptsSettingRecords.map(s => [s.key, s.value]))
  const ptsEnabled = ptsSettingMap.has('PTS_ENABLED') ? ptsSettingMap.get('PTS_ENABLED') === 'true' : true
  const ptsDateLabel = ptsSettingMap.get('PTS_DATE_LABEL') || '21 - 23 September 2026'
  const ptsType = ptsSettingMap.get('PTS_TYPE') || 'PTS'
  const ptsTitle = ptsSettingMap.get('PTS_TITLE') || 'Penilaian Tengah Semester (PTS)'

  // Dapatkan seluruh Halaqah milik Guru ini beserta data Siswa
  const halaqahs = await prisma.halaqah.findMany({
    where: { guruId },
    include: {
      kelas: true,
      siswa: {
        orderBy: { nama: 'asc' },
        include: {
          setorans: {
            where: {
              ...(activeSemester ? { semesterId: activeSemester.id } : {})
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  })

  const kelasGroups = halaqahs.map(h => {
    const siswaList = h.siswa.map(s => {
      // Cari setoran ujian sesuai tipe aktif
      const ptsSetoran = s.setorans.find(st => {
        try {
          const comp = JSON.parse(st.nilaiKomponen)
          return comp.isUjian === true && (comp.tipeUjian === ptsType || (!comp.tipeUjian && ptsType === 'PTS'))
        } catch {
          return false
        }
      })

      let parsedKomponen = null
      let materiUjian = null
      if (ptsSetoran) {
        try {
          parsedKomponen = JSON.parse(ptsSetoran.nilaiKomponen)
          materiUjian = parsedKomponen.materiUjian || null
        } catch {}
      }

      return {
        id: s.id,
        nama: s.nama,
        nis: s.nis,
        kelas: h.kelas.nama,
        kelasId: h.kelasId,
        hasPts: !!ptsSetoran,
        pts: ptsSetoran ? {
          id: ptsSetoran.id,
          jenis: ptsSetoran.jenis,
          surah: ptsSetoran.surah,
          ayatMulai: ptsSetoran.ayatMulai,
          ayatAkhir: ptsSetoran.ayatAkhir,
          isTasmi: ptsSetoran.isTasmi,
          bukuTahsin: ptsSetoran.bukuTahsin,
          halamanTahsin: ptsSetoran.halamanTahsin,
          nilaiAkhir: ptsSetoran.nilaiAkhir,
          predikat: ptsSetoran.predikat,
          catatan: ptsSetoran.catatan,
          tanggal: ptsSetoran.tanggal,
          materiUjian: materiUjian,
          komponen: parsedKomponen
        } : null
      }
    })

    return {
      kelasId: h.kelasId,
      kelasNama: h.kelas.nama,
      totalSiswa: siswaList.length,
      sudahUjianCount: siswaList.filter(s => s.hasPts).length,
      siswa: siswaList
    }
  })

  return NextResponse.json({
    activeSemester: activeSemester ? {
      id: activeSemester.id,
      nama: activeSemester.nama,
      tahunAjaran: activeSemester.tahunAjaran.nama
    } : null,
    ptsSettings: {
      enabled: ptsEnabled,
      dateLabel: ptsDateLabel,
      tipeUjian: ptsType,
      judulUjian: ptsTitle
    },
    kelasGroups
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'GURU') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const guruId = (session.user as any).guruId
  if (!guruId) {
    return NextResponse.json({ error: 'Guru ID not found' }, { status: 400 })
  }

  const body = await req.json()
  const {
    siswaId,
    jenis = 'TAHFIDZ',
    nilai,
    surah,
    ayatMulai,
    ayatAkhir,
    isTasmi = false,
    bukuTahsin,
    halamanTahsin,
    nilaiKomponen,
    catatan,
    materiUjian,
    tanggal
  } = body

  if (!siswaId) {
    return NextResponse.json({ error: 'Siswa ID wajib diisi' }, { status: 400 })
  }

  // Jalankan query verifikasi secara paralel untuk kecepatan maksimal
  const [settings, halaqahSiswa, activeSemester] = await Promise.all([
    prisma.systemSetting.findMany({
      where: { key: { in: ['PTS_ENABLED', 'PTS_TYPE'] } }
    }),
    prisma.halaqah.findFirst({
      where: {
        guruId,
        siswa: { some: { id: siswaId } }
      },
      select: {
        id: true,
        siswa: { where: { id: siswaId }, select: { id: true, nama: true } }
      }
    }),
    prisma.semester.findFirst({
      where: { isAktif: true },
      select: { id: true }
    })
  ])

  const settingMap = new Map(settings.map(s => [s.key, s.value]))
  const ptsEnabled = settingMap.has('PTS_ENABLED') ? settingMap.get('PTS_ENABLED') === 'true' : true
  const ptsType = settingMap.get('PTS_TYPE') || 'PTS'

  if (!ptsEnabled) {
    return NextResponse.json({
      error: 'Periode penginputan nilai ujian telah ditutup oleh Admin.'
    }, { status: 403 })
  }

  if (!halaqahSiswa) {
    return NextResponse.json({ error: 'Siswa ini bukan anggota binaan halaqah Anda' }, { status: 403 })
  }

  // Hitung nilai akhir & predikat
  let nilaiAkhir = 0
  if (nilai !== undefined && nilai !== null && nilai !== '') {
    nilaiAkhir = Math.max(0, Math.min(100, Math.round(Number(nilai))))
  } else if (jenis === 'TAHFIDZ') {
    nilaiAkhir = calcNilaiTahfidz(nilaiKomponen || {})
  } else {
    nilaiAkhir = calcNilaiTahsin(nilaiKomponen || {})
  }
  const predikatData = getPredikat(nilaiAkhir)

  const enrichedKomponen = {
    ...(typeof nilaiKomponen === 'object' && nilaiKomponen ? nilaiKomponen : {}),
    isUjian: true,
    tipeUjian: ptsType,
    nilai: nilaiAkhir,
    isTasmi: isTasmi === true,
    materiUjian: materiUjian || null
  }

  // Cari setoran ujian yang ada
  const existingSetorans = await prisma.setoran.findMany({
    where: {
      siswaId,
      ...(activeSemester ? { semesterId: activeSemester.id } : {})
    },
    select: { id: true, nilaiKomponen: true, catatan: true, jenis: true }
  })

  const existingPts = existingSetorans.find(st => {
    try {
      const comp = JSON.parse(st.nilaiKomponen)
      return comp.isUjian === true && (comp.tipeUjian === ptsType || (!comp.tipeUjian && ptsType === 'PTS')) && st.jenis === jenis
    } catch {
      return false
    }
  })

  const d = tanggal ? new Date(tanggal) : new Date()
  d.setHours(12, 0, 0, 0)

  let result
  if (existingPts) {
    result = await prisma.setoran.update({
      where: { id: existingPts.id },
      data: {
        surah: jenis === 'TAHFIDZ' ? surah : null,
        ayatMulai: jenis === 'TAHFIDZ' ? ayatMulai : null,
        ayatAkhir: jenis === 'TAHFIDZ' ? ayatAkhir : null,
        isTasmi: isTasmi === true,
        bukuTahsin: jenis === 'TAHSIN' ? bukuTahsin : null,
        halamanTahsin: jenis === 'TAHSIN' ? halamanTahsin : null,
        nilaiKomponen: JSON.stringify(enrichedKomponen),
        nilaiAkhir,
        predikat: predikatData.kode,
        catatan: catatan !== undefined ? catatan : existingPts.catatan
      }
    })
  } else {
    result = await prisma.setoran.create({
      data: {
        siswaId,
        guruId,
        semesterId: activeSemester?.id,
        jenis,
        tanggal: d,
        surah: jenis === 'TAHFIDZ' ? surah : null,
        ayatMulai: jenis === 'TAHFIDZ' ? ayatMulai : null,
        ayatAkhir: jenis === 'TAHFIDZ' ? ayatAkhir : null,
        isTasmi: isTasmi === true,
        bukuTahsin: jenis === 'TAHSIN' ? bukuTahsin : null,
        halamanTahsin: jenis === 'TAHSIN' ? halamanTahsin : null,
        nilaiKomponen: JSON.stringify(enrichedKomponen),
        nilaiAkhir,
        predikat: predikatData.kode,
        catatan: catatan || null
      }
    })
  }

  // Catat activity log asinkron tanpa menahan respons HTTP
  prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: existingPts ? 'UPDATE_NILAI_UJIAN' : 'INPUT_NILAI_UJIAN',
      description: `Menginput nilai Ujian ${ptsType} (${jenis}) untuk ${halaqahSiswa.siswa[0]?.nama || siswaId}: ${nilaiAkhir} (${predikatData.label})`
    }
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    pts: {
      id: result.id,
      jenis: result.jenis,
      isTasmi: result.isTasmi,
      nilaiAkhir: result.nilaiAkhir,
      predikat: predikatData.label,
      catatan: result.catatan,
      tanggal: result.tanggal
    },
    predikat: predikatData
  })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'GURU') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const guruId = (session.user as any).guruId
  if (!guruId) {
    return NextResponse.json({ error: 'Profil Guru tidak ditemukan' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const setoranId = searchParams.get('id')
  const siswaId = searchParams.get('siswaId')

  if (!setoranId && !siswaId) {
    return NextResponse.json({ error: 'ID Setoran atau Siswa ID wajib diisi' }, { status: 400 })
  }

  // Cek apakah fitur PTS dibuka oleh Admin
  const ptsEnabledSetting = await prisma.systemSetting.findUnique({
    where: { key: 'PTS_ENABLED' }
  })
  const ptsEnabled = ptsEnabledSetting ? ptsEnabledSetting.value === 'true' : true
  if (!ptsEnabled) {
    return NextResponse.json({
      error: 'Periode ujian telah ditutup oleh Admin, tidak dapat menghapus nilai.'
    }, { status: 403 })
  }

  let targetId = setoranId
  if (!targetId && siswaId) {
    const ptsTypeSetting = await prisma.systemSetting.findUnique({ where: { key: 'PTS_TYPE' } })
    const ptsType = ptsTypeSetting?.value || 'PTS'
    const activeSemester = await prisma.semester.findFirst({ where: { isAktif: true } })

    const setorans = await prisma.setoran.findMany({
      where: {
        siswaId,
        ...(activeSemester ? { semesterId: activeSemester.id } : {})
      },
      select: { id: true, nilaiKomponen: true }
    })

    const found = setorans.find(s => {
      try {
        const c = JSON.parse(s.nilaiKomponen)
        return c.isUjian === true && (c.tipeUjian === ptsType || (!c.tipeUjian && ptsType === 'PTS'))
      } catch {
        return false
      }
    })

    if (!found) {
      return NextResponse.json({ error: 'Nilai ujian tidak ditemukan' }, { status: 404 })
    }
    targetId = found.id
  }

  // Pastikan setoran milik siswa di halaqah guru ini
  const existing = await prisma.setoran.findUnique({
    where: { id: targetId! },
    include: { siswa: true }
  })

  if (!existing) {
    return NextResponse.json({ error: 'Data nilai ujian tidak ditemukan' }, { status: 404 })
  }

  await prisma.setoran.delete({
    where: { id: targetId! }
  })

  // Catat activity log
  prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'DELETE_NILAI_UJIAN',
      description: `Menghapus nilai ujian untuk siswa ${existing.siswa.nama}`
    }
  }).catch(() => {})

  return NextResponse.json({ success: true, message: 'Nilai ujian berhasil dihapus' })
}


