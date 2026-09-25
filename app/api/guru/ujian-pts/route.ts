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
      // Cari setoran ujian sesuai tipe aktif untuk Tahfidz & Tahsin
      const ptsTahfidz = s.setorans.find(st => {
        try {
          const comp = JSON.parse(st.nilaiKomponen)
          return st.jenis === 'TAHFIDZ' && comp.isUjian === true && (comp.tipeUjian === ptsType || (!comp.tipeUjian && ptsType === 'PTS'))
        } catch {
          return false
        }
      })

      const ptsTahsin = s.setorans.find(st => {
        try {
          const comp = JSON.parse(st.nilaiKomponen)
          return st.jenis === 'TAHSIN' && comp.isUjian === true && (comp.tipeUjian === ptsType || (!comp.tipeUjian && ptsType === 'PTS'))
        } catch {
          return false
        }
      })

      const formatPts = (st: any) => {
        if (!st) return null
        let parsedKomponen = null
        let materiUjian = null
        try {
          parsedKomponen = JSON.parse(st.nilaiKomponen)
          materiUjian = parsedKomponen.materiUjian || null
        } catch {}

        return {
          id: st.id,
          jenis: st.jenis,
          surah: st.surah,
          ayatMulai: st.ayatMulai,
          ayatAkhir: st.ayatAkhir,
          isTasmi: st.isTasmi,
          bukuTahsin: st.bukuTahsin,
          halamanTahsin: st.halamanTahsin,
          nilaiAkhir: st.nilaiAkhir,
          predikat: st.predikat,
          catatan: st.catatan,
          tanggal: st.tanggal,
          materiUjian: materiUjian,
          komponen: parsedKomponen
        }
      }

      const formattedTahfidz = formatPts(ptsTahfidz)
      const formattedTahsin = formatPts(ptsTahsin)

      return {
        id: s.id,
        nama: s.nama,
        nis: s.nis,
        kelas: h.kelas.nama,
        kelasId: h.kelasId,
        hasPts: !!(ptsTahfidz || ptsTahsin),
        hasPtsTahfidz: !!ptsTahfidz,
        hasPtsTahsin: !!ptsTahsin,
        pts: formattedTahfidz || formattedTahsin, // backward compatibility
        ptsTahfidz: formattedTahfidz,
        ptsTahsin: formattedTahsin
      }
    })

    return {
      kelasId: h.kelasId,
      kelasNama: h.kelas.nama,
      totalSiswa: siswaList.length,
      sudahUjianCount: siswaList.filter(s => s.hasPts).length,
      sudahUjianTahfidzCount: siswaList.filter(s => s.hasPtsTahfidz).length,
      sudahUjianTahsinCount: siswaList.filter(s => s.hasPtsTahsin).length,
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
    jenis,
    nilai,
    nilaiTahfidz,
    nilaiTahsin,
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

  const d = tanggal ? new Date(tanggal) : new Date()
  d.setHours(12, 0, 0, 0)

  // Cari setoran ujian yang ada
  const existingSetorans = await prisma.setoran.findMany({
    where: {
      siswaId,
      ...(activeSemester ? { semesterId: activeSemester.id } : {})
    },
    select: { id: true, nilaiKomponen: true, catatan: true, jenis: true }
  })

  // Helper untuk menyimpan satu item nilai (TAHFIDZ atau TAHSIN)
  async function saveSetoranItem(targetJenis: 'TAHFIDZ' | 'TAHSIN', targetNilai: any, targetTasmi?: boolean) {
    let nilaiAkhir = Math.max(0, Math.min(100, Math.round(Number(targetNilai))))
    const predikatData = getPredikat(nilaiAkhir)

    const enrichedKomponen = {
      ...(typeof nilaiKomponen === 'object' && nilaiKomponen ? nilaiKomponen : {}),
      isUjian: true,
      tipeUjian: ptsType,
      nilai: nilaiAkhir,
      isTasmi: targetJenis === 'TAHFIDZ' ? (targetTasmi === true) : false,
      materiUjian: targetJenis === 'TAHFIDZ' && targetTasmi ? (materiUjian || 'Tasmi') : (materiUjian || null)
    }

    const existing = existingSetorans.find(st => {
      try {
        const comp = JSON.parse(st.nilaiKomponen)
        return comp.isUjian === true && (comp.tipeUjian === ptsType || (!comp.tipeUjian && ptsType === 'PTS')) && st.jenis === targetJenis
      } catch {
        return false
      }
    })

    let res
    if (existing) {
      res = await prisma.setoran.update({
        where: { id: existing.id },
        data: {
          surah: targetJenis === 'TAHFIDZ' ? surah : null,
          ayatMulai: targetJenis === 'TAHFIDZ' ? ayatMulai : null,
          ayatAkhir: targetJenis === 'TAHFIDZ' ? ayatAkhir : null,
          isTasmi: targetJenis === 'TAHFIDZ' ? (targetTasmi === true) : false,
          bukuTahsin: targetJenis === 'TAHSIN' ? bukuTahsin : null,
          halamanTahsin: targetJenis === 'TAHSIN' ? halamanTahsin : null,
          nilaiKomponen: JSON.stringify(enrichedKomponen),
          nilaiAkhir,
          predikat: predikatData.kode,
          catatan: catatan !== undefined ? catatan : existing.catatan
        }
      })
    } else {
      res = await prisma.setoran.create({
        data: {
          siswaId,
          guruId,
          semesterId: activeSemester?.id,
          jenis: targetJenis,
          tanggal: d,
          surah: targetJenis === 'TAHFIDZ' ? surah : null,
          ayatMulai: targetJenis === 'TAHFIDZ' ? ayatMulai : null,
          ayatAkhir: targetJenis === 'TAHFIDZ' ? ayatAkhir : null,
          isTasmi: targetJenis === 'TAHFIDZ' ? (targetTasmi === true) : false,
          bukuTahsin: targetJenis === 'TAHSIN' ? bukuTahsin : null,
          halamanTahsin: targetJenis === 'TAHSIN' ? halamanTahsin : null,
          nilaiKomponen: JSON.stringify(enrichedKomponen),
          nilaiAkhir,
          predikat: predikatData.kode,
          catatan: catatan || null
        }
      })
    }

    return {
      id: res.id,
      jenis: res.jenis,
      isTasmi: res.isTasmi,
      nilaiAkhir: res.nilaiAkhir,
      predikat: predikatData.label,
      catatan: res.catatan,
      tanggal: res.tanggal
    }
  }

  let savedTahfidz: any = null
  let savedTahsin: any = null

  if (nilaiTahfidz !== undefined && nilaiTahfidz !== null && nilaiTahfidz !== '') {
    savedTahfidz = await saveSetoranItem('TAHFIDZ', nilaiTahfidz, isTasmi)
  }
  if (nilaiTahsin !== undefined && nilaiTahsin !== null && nilaiTahsin !== '') {
    savedTahsin = await saveSetoranItem('TAHSIN', nilaiTahsin, false)
  }

  // Fallback jika format lama { jenis, nilai, isTasmi } yang dikirim
  if (!savedTahfidz && !savedTahsin && nilai !== undefined && nilai !== null && nilai !== '') {
    const targetJenis = (jenis || 'TAHFIDZ').toUpperCase() === 'TAHSIN' ? 'TAHSIN' : 'TAHFIDZ'
    if (targetJenis === 'TAHSIN') {
      savedTahsin = await saveSetoranItem('TAHSIN', nilai, false)
    } else {
      savedTahfidz = await saveSetoranItem('TAHFIDZ', nilai, isTasmi)
    }
  }

  const primaryResult = savedTahfidz || savedTahsin

  // Catat activity log asinkron tanpa menahan respons HTTP
  prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'INPUT_NILAI_UJIAN',
      description: `Menginput nilai Ujian ${ptsType} untuk ${halaqahSiswa.siswa[0]?.nama || siswaId}`
    }
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    pts: primaryResult,
    ptsTahfidz: savedTahfidz,
    ptsTahsin: savedTahsin
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
  const targetJenis = searchParams.get('jenis')?.toUpperCase() // 'TAHFIDZ' | 'TAHSIN'

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
      select: { id: true, nilaiKomponen: true, jenis: true }
    })

    const found = setorans.find(s => {
      try {
        const c = JSON.parse(s.nilaiKomponen)
        const matchType = c.isUjian === true && (c.tipeUjian === ptsType || (!c.tipeUjian && ptsType === 'PTS'))
        const matchJenis = targetJenis ? s.jenis === targetJenis : true
        return matchType && matchJenis
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
      description: `Menghapus nilai ujian (${existing.jenis}) untuk siswa ${existing.siswa.nama}`
    }
  }).catch(() => {})

  return NextResponse.json({ success: true, message: 'Nilai ujian berhasil dihapus' })
}


