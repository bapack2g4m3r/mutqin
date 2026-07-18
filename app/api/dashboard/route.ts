import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard — stats for admin & guru
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const [
    totalSiswa,
    totalGuru,
    setoranHariIni,
    setoranMingguIni,
    siswaHariIni,
  ] = await Promise.all([
    prisma.siswa.count(),
    prisma.guru.count(),
    prisma.setoran.count({
      where: { tanggal: { gte: today, lte: todayEnd } },
    }),
    prisma.setoran.count({
      where: { tanggal: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.setoran.findMany({
      where: { tanggal: { gte: today, lte: todayEnd } },
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
      tanggal: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  })

  // Setoran terbaru
  const setoranTerbaru = await prisma.setoran.findMany({
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
  })

  return NextResponse.json({
    totalSiswa,
    totalGuru,
    setoranHariIni,
    setoranMingguIni,
    siswaUdahSetor,
    siswaBelumSetor,
    setoranTerbaru,
    predikatStats,
  })
}
