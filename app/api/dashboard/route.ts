import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard — stats for admin & guru
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const kelasFilter = searchParams.get('kelas') || '' // '7', '8', '9', or ''

  const role = (session.user as any).role

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const whereSiswa: any = {}
  if (kelasFilter && kelasFilter !== 'Semua') whereSiswa.kelas = { startsWith: kelasFilter }

  const whereSetoran: any = {}
  if (kelasFilter && kelasFilter !== 'Semua') whereSetoran.siswa = { kelas: { startsWith: kelasFilter } }

  const [
    totalSiswa,
    totalGuru,
    setoranHariIni,
    setoranMingguIni,
    siswaHariIni,
  ] = await Promise.all([
    prisma.siswa.count({ where: whereSiswa }),
    prisma.guru.count(),
    prisma.setoran.count({
      where: { ...whereSetoran, tanggal: { gte: today, lte: todayEnd } },
    }),
    prisma.setoran.count({
      where: { ...whereSetoran, tanggal: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.setoran.findMany({
      where: { ...whereSetoran, tanggal: { gte: today, lte: todayEnd } },
      distinct: ['siswaId'],
      select: { siswaId: true },
    }),
  ])

  const siswaUdahSetor = siswaHariIni.length
  const siswaBelumSetor = totalSiswa - siswaUdahSetor

  // Setoran per kelas (last 30 days)
  const setoranPerKelas = await prisma.setoran.groupBy({
    by: ['siswaId'],
    _count: { id: true },
    where: {
      ...whereSetoran,
      tanggal: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  })

  // Setoran terbaru
  const setoranTerbaru = await prisma.setoran.findMany({
    where: whereSetoran,
    take: 10,
    orderBy: { tanggal: 'desc' },
    include: {
      siswa: { select: { nama: true, kelas: true, nis: true } },
      guru:  { include: { user: { select: { name: true } } } },
    },
  })

  // Predikat distribution
  const predikatStats = await prisma.setoran.groupBy({
    by: ['predikat'],
    _count: { id: true },
    where: whereSetoran,
  })

  // === Capaian Siswa Metrics ===

  // 1. Capaian Tahfidz (capaianJuz from Siswa)
  const tahfidzStatsRaw = await prisma.siswa.groupBy({
    by: ['capaianJuz'],
    _count: { id: true },
    where: whereSiswa,
  })
  
  // Format to standard 0,1,2,3
  const tahfidzStats = [0, 1, 2, 3].map(juzVal => ({
    capaianJuz: juzVal,
    count: tahfidzStatsRaw.find(s => s.capaianJuz === juzVal)?._count.id || 0
  }))

  // 2. KPI Tasmi
  const tasmiSetoran = await prisma.setoran.findMany({
    where: { ...whereSetoran, isTasmi: true },
    distinct: ['siswaId'],
    select: { siswaId: true }
  })
  const tasmiCount = tasmiSetoran.length

  // 3. Capaian Tahsin
  // Since Prisma doesn't support SELECT DISTINCT ON, we'll fetch distinct tahsin setorans
  // This could be heavy if unoptimized, but we only fetch students who have Tahsin
  // We'll fetch all Tahsin setorans grouped by student and pick the latest, but Prisma can't easily group and return latest in one go.
  // Instead, we can do it via raw SQL, or fetch all Tahsin setorans, ordered by date, and filter in JS.
  const allTahsin = await prisma.setoran.findMany({
    where: { ...whereSetoran, jenis: 'TAHSIN', bukuTahsin: { not: null } },
    orderBy: { tanggal: 'desc' },
    select: { siswaId: true, bukuTahsin: true }
  })

  const tahsinMap = new Map<string, string>()
  allTahsin.forEach(s => {
    if (!tahsinMap.has(s.siswaId) && s.bukuTahsin) {
      tahsinMap.set(s.siswaId, s.bukuTahsin)
    }
  })

  const tahsinStatsRaw: Record<string, number> = {}
  tahsinMap.forEach(buku => {
    tahsinStatsRaw[buku] = (tahsinStatsRaw[buku] || 0) + 1
  })

  const tahsinStats = Object.entries(tahsinStatsRaw)
    .map(([buku, count]) => ({ buku, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    totalSiswa,
    totalGuru,
    setoranHariIni,
    setoranMingguIni,
    siswaUdahSetor,
    siswaBelumSetor,
    setoranTerbaru,
    predikatStats,
    tahfidzStats,
    tasmiCount,
    tahsinStats,
  })
}
