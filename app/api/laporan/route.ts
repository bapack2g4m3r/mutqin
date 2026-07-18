import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/laporan — rekap data for export
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const kelas = searchParams.get('kelas')
  const from  = searchParams.get('from')
  const to    = searchParams.get('to')
  const jenis = searchParams.get('jenis')

  const where: any = {}
  if (jenis) where.jenis = jenis
  if (from || to) {
    where.tanggal = {}
    if (from) where.tanggal.gte = new Date(from)
    if (to)   where.tanggal.lte = new Date(to)
  }
  if (kelas) where.siswa = { kelas }

  const setorans = await prisma.setoran.findMany({
    where,
    include: {
      siswa: { select: { nama: true, kelas: true, nis: true } },
      guru:  { include: { user: { select: { name: true } } } },
    },
    orderBy: [{ siswa: { kelas: 'asc' } }, { tanggal: 'desc' }],
  })

  // Group by siswa for summary
  const summary: Record<string, any> = {}
  for (const s of setorans) {
    const key = s.siswaId
    if (!summary[key]) {
      summary[key] = {
        siswa: s.siswa,
        tahfidz: { count: 0, totalNilai: 0, lastNilai: null },
        tahsin:  { count: 0, totalNilai: 0, lastNilai: null },
      }
    }
    if (s.jenis === 'TAHFIDZ') {
      summary[key].tahfidz.count++
      summary[key].tahfidz.totalNilai += s.nilaiAkhir
      if (!summary[key].tahfidz.lastNilai) summary[key].tahfidz.lastNilai = s.nilaiAkhir
    } else {
      summary[key].tahsin.count++
      summary[key].tahsin.totalNilai += s.nilaiAkhir
      if (!summary[key].tahsin.lastNilai) summary[key].tahsin.lastNilai = s.nilaiAkhir
    }
  }

  return NextResponse.json({
    setorans,
    summary: Object.values(summary),
    total: setorans.length,
  })
}
