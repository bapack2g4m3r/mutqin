import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPredikat, combineNilaiRapor } from '@/lib/surah-data'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: siswaId } = await params
  if (!siswaId) return NextResponse.json({ error: 'Siswa ID required' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const semesterId = searchParams.get('semesterId')

  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    include: {
      kelasRef: { include: { tahunAjaran: true } },
      halaqah: { include: { guru: { include: { user: true } } } }
    }
  })

  if (!siswa) return NextResponse.json({ error: 'Siswa not found' }, { status: 404 })

  let activeSemesterName = 'Ganjil'
  if (semesterId) {
    const sem = await prisma.semester.findUnique({ where: { id: semesterId } })
    if (sem) activeSemesterName = sem.nama
  } else {
    const active = await prisma.semester.findFirst({ where: { isAktif: true } })
    if (active) activeSemesterName = active.nama
  }

  const whereSetoran: any = { siswaId }
  if (semesterId) whereSetoran.semesterId = semesterId

  const setorans = await prisma.setoran.findMany({
    where: whereSetoran
  })

  const isPtsSetoran = (s: any) => {
    try {
      const p = JSON.parse(s.nilaiKomponen)
      return p.isUjian === true
    } catch {
      return false
    }
  }

  // Ambil konfigurasi bobot rapor dari SystemSetting
  const ptsWeightRecords = await prisma.systemSetting.findMany({
    where: { key: { in: ['PTS_WEIGHT_HARIAN', 'PTS_WEIGHT_PTS'] } }
  })
  const ptsWeightMap = new Map(ptsWeightRecords.map(s => [s.key, s.value]))
  const weightHarian = ptsWeightMap.has('PTS_WEIGHT_HARIAN') ? parseInt(ptsWeightMap.get('PTS_WEIGHT_HARIAN')!) || 40 : 40
  const weightPts = ptsWeightMap.has('PTS_WEIGHT_PTS') ? parseInt(ptsWeightMap.get('PTS_WEIGHT_PTS')!) || 60 : 60
  const customWeights = { harian: weightHarian, pts: weightPts }

  const tahfidz = setorans.filter(s => s.jenis === 'TAHFIDZ')
  const tahsin = setorans.filter(s => s.jenis === 'TAHSIN')

  const tahfidzHarian = tahfidz.filter(s => !isPtsSetoran(s))
  const tahfidzPts = tahfidz.find(s => isPtsSetoran(s))

  const tahsinHarian = tahsin.filter(s => !isPtsSetoran(s))
  const tahsinPts = tahsin.find(s => isPtsSetoran(s))

  // ─── 1. TAHFIDZ ─────────────────────────────────────────────────────────────
  // Rata-rata Harian
  const tKelancaran = tahfidzHarian.map(s => {
    try {
      const p = JSON.parse(s.nilaiKomponen)
      return p.kelancaran || 0
    } catch { return 0 }
  })
  const tFasohah = tahfidzHarian.map(s => {
    try {
      const p = JSON.parse(s.nilaiKomponen)
      return p.fasohah ?? p.tajwid ?? 0
    } catch { return 0 }
  })
  const tNaghom = tahfidzHarian.map(s => {
    try {
      const p = JSON.parse(s.nilaiKomponen)
      return p.naghom ?? p.makhorijulHuruf ?? 0
    } catch { return 0 }
  })
  
  const avgKelancaranTfHarian = tKelancaran.length ? Math.round(tKelancaran.reduce((a,b)=>a+b,0) / tKelancaran.length) : 0
  const avgFasohahTfHarian = tFasohah.length ? Math.round(tFasohah.reduce((a,b)=>a+b,0) / tFasohah.length) : 0
  const avgNaghomTfHarian = tNaghom.length ? Math.round(tNaghom.reduce((a,b)=>a+b,0) / tNaghom.length) : 0
  
  const nilaiAkhirTfHarian = avgKelancaranTfHarian || avgFasohahTfHarian || avgNaghomTfHarian 
    ? Math.round((avgKelancaranTfHarian * 0.4) + (avgFasohahTfHarian * 0.4) + (avgNaghomTfHarian * 0.2)) : 0

  // Komponen PTS
  let ptsKelancaranTf: number | null = null
  let ptsFasohahTf: number | null = null
  let ptsNaghomTf: number | null = null
  let nilaiAkhirTfPts: number | null = null

  if (tahfidzPts) {
    try {
      const p = JSON.parse(tahfidzPts.nilaiKomponen)
      ptsKelancaranTf = p.kelancaran ?? p.nilai ?? tahfidzPts.nilaiAkhir ?? null
      ptsFasohahTf = p.fasohah ?? p.tajwid ?? p.nilai ?? tahfidzPts.nilaiAkhir ?? null
      ptsNaghomTf = p.naghom ?? p.makhorijulHuruf ?? p.nilai ?? tahfidzPts.nilaiAkhir ?? null
    } catch {}
    nilaiAkhirTfPts = tahfidzPts.nilaiAkhir
  }

  // Kombinasi Nilai (Opsi B: Bobot Harian + PTS dinamis)
  const finalKelancaranTf = combineNilaiRapor(avgKelancaranTfHarian, ptsKelancaranTf, customWeights)
  const finalFasohahTf = combineNilaiRapor(avgFasohahTfHarian, ptsFasohahTf, customWeights)
  const finalNaghomTf = combineNilaiRapor(avgNaghomTfHarian, ptsNaghomTf, customWeights)
  const finalNilaiAkhirTf = combineNilaiRapor(nilaiAkhirTfHarian, nilaiAkhirTfPts, customWeights)


  // ─── 2. TAHSIN ──────────────────────────────────────────────────────────────
  // Rata-rata Harian
  const tsKelancaran = tahsinHarian.map(s => {
    try {
      const p = JSON.parse(s.nilaiKomponen)
      return p.kelancaranBacaan ?? p.makhorijulHuruf ?? 0
    } catch { return 0 }
  })
  const tsTajwid = tahsinHarian.map(s => {
    try {
      const p = JSON.parse(s.nilaiKomponen)
      return p.tajwid ?? p.sifatulHuruf ?? 0
    } catch { return 0 }
  })
  const tsMakhroj = tahsinHarian.map(s => {
    try {
      const p = JSON.parse(s.nilaiKomponen)
      return p.makhroj ?? p.ahkamulMad ?? 0
    } catch { return 0 }
  })
  const tsAdab = tahsinHarian.map(s => {
    try {
      const p = JSON.parse(s.nilaiKomponen)
      return p.adab ?? p.ahkamulWaqaf ?? 0
    } catch { return 0 }
  })

  const avgKelancaranTsHarian = tsKelancaran.length ? Math.round(tsKelancaran.reduce((a,b)=>a+b,0) / tsKelancaran.length) : 0
  const avgTajwidTsHarian = tsTajwid.length ? Math.round(tsTajwid.reduce((a,b)=>a+b,0) / tsTajwid.length) : 0
  const avgMakhrojTsHarian = tsMakhroj.length ? Math.round(tsMakhroj.reduce((a,b)=>a+b,0) / tsMakhroj.length) : 0
  const avgAdabTsHarian = tsAdab.length ? Math.round(tsAdab.reduce((a,b)=>a+b,0) / tsAdab.length) : 0

  const nilaiAkhirTsHarian = avgKelancaranTsHarian || avgTajwidTsHarian || avgMakhrojTsHarian || avgAdabTsHarian
    ? Math.round((avgKelancaranTsHarian + avgTajwidTsHarian + avgMakhrojTsHarian + avgAdabTsHarian) / 4) : 0

  // Komponen PTS
  let ptsKelancaranTs: number | null = null
  let ptsTajwidTs: number | null = null
  let ptsMakhrojTs: number | null = null
  let ptsAdabTs: number | null = null
  let nilaiAkhirTsPts: number | null = null

  if (tahsinPts) {
    try {
      const p = JSON.parse(tahsinPts.nilaiKomponen)
      ptsKelancaranTs = p.kelancaranBacaan ?? p.makhorijulHuruf ?? p.nilai ?? tahsinPts.nilaiAkhir ?? null
      ptsTajwidTs = p.tajwid ?? p.sifatulHuruf ?? p.nilai ?? tahsinPts.nilaiAkhir ?? null
      ptsMakhrojTs = p.makhroj ?? p.ahkamulMad ?? p.nilai ?? tahsinPts.nilaiAkhir ?? null
      ptsAdabTs = p.adab ?? p.ahkamulWaqaf ?? p.nilai ?? tahsinPts.nilaiAkhir ?? null
    } catch {}
    nilaiAkhirTsPts = tahsinPts.nilaiAkhir
  }

  // Kombinasi Nilai (Opsi B: Bobot Harian + PTS dinamis)
  const finalKelancaranTs = combineNilaiRapor(avgKelancaranTsHarian, ptsKelancaranTs, customWeights)
  const finalTajwidTs = combineNilaiRapor(avgTajwidTsHarian, ptsTajwidTs, customWeights)
  const finalMakhrojTs = combineNilaiRapor(avgMakhrojTsHarian, ptsMakhrojTs, customWeights)
  const finalAdabTs = combineNilaiRapor(avgAdabTsHarian, ptsAdabTs, customWeights)
  const finalNilaiAkhirTs = combineNilaiRapor(nilaiAkhirTsHarian, nilaiAkhirTsPts, customWeights)

  return NextResponse.json({
    siswa,
    semester: activeSemesterName,
    rapor: {
      tahfidz: {
        komponen: [
          { nama: 'Kelancaran Hafalan', kkm: 70, nilai: finalKelancaranTf, ...getPredikat(finalKelancaranTf) },
          { nama: 'Fasohah', kkm: 70, nilai: finalFasohahTf, ...getPredikat(finalFasohahTf) },
          { nama: 'Naghom', kkm: 70, nilai: finalNaghomTf, ...getPredikat(finalNaghomTf) }
        ],
        nilaiAkhir: finalNilaiAkhirTf,
        predikat: getPredikat(finalNilaiAkhirTf),
        detail: {
          nilaiHarian: nilaiAkhirTfHarian,
          nilaiPts: nilaiAkhirTfPts,
          hasPts: !!tahfidzPts
        }
      },
      tahsin: {
        komponen: [
          { nama: 'Kelancaran Bacaan', kkm: 70, nilai: finalKelancaranTs, ...getPredikat(finalKelancaranTs) },
          { nama: 'Tajwid', kkm: 70, nilai: finalTajwidTs, ...getPredikat(finalTajwidTs) },
          { nama: 'Makhroj', kkm: 70, nilai: finalMakhrojTs, ...getPredikat(finalMakhrojTs) },
          { nama: 'Adab', kkm: 70, nilai: finalAdabTs, ...getPredikat(finalAdabTs) }
        ],
        nilaiAkhir: finalNilaiAkhirTs,
        predikat: getPredikat(finalNilaiAkhirTs),
        detail: {
          nilaiHarian: nilaiAkhirTsHarian,
          nilaiPts: nilaiAkhirTsPts,
          hasPts: !!tahsinPts
        }
      }
    }
  })
}
