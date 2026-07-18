import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcNilaiTahfidz, calcNilaiTahsin, getPredikat } from '@/lib/surah-data'

// GET /api/setoran — list setoran dengan filter
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const siswaId = searchParams.get('siswaId')
  const jenis   = searchParams.get('jenis')
  const kelas   = searchParams.get('kelas')
  const from    = searchParams.get('from')
  const to      = searchParams.get('to')
  const page    = parseInt(searchParams.get('page') || '1')
  const limit   = parseInt(searchParams.get('limit') || '20')
  const skip    = (page - 1) * limit

  const where: any = {}
  if (siswaId) where.siswaId = siswaId
  if (jenis)   where.jenis = jenis
  if (from || to) {
    where.tanggal = {}
    if (from) where.tanggal.gte = new Date(from)
    if (to)   where.tanggal.lte = new Date(to)
  }
  if (kelas) {
    where.siswa = { kelas }
  }

  const [setorans, total] = await Promise.all([
    prisma.setoran.findMany({
      where,
      skip,
      take: limit,
      include: {
        siswa: { select: { id: true, nama: true, kelas: true, nis: true } },
        guru:  { include: { user: { select: { name: true } } } },
      },
      orderBy: { tanggal: 'desc' },
    }),
    prisma.setoran.count({ where }),
  ])

  return NextResponse.json({ setorans, total, page, limit })
}

// POST /api/setoran — buat setoran baru
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role   = (session.user as any).role
  const guruId = (session.user as any).guruId
  if (role !== 'GURU' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const {
    siswaId, jenis,
    surah, ayatMulai, ayatAkhir, halMulai, halAkhir, isTasmi,
    nilaiKomponen, catatan,
  } = body

  // Calculate nilai akhir
  let nilaiAkhir: number
  if (jenis === 'TAHFIDZ') {
    nilaiAkhir = calcNilaiTahfidz(nilaiKomponen)
  } else {
    nilaiAkhir = calcNilaiTahsin(nilaiKomponen)
  }

  const predikatData = getPredikat(nilaiAkhir)

  // Resolve guruId
  let resolvedGuruId = guruId
  if (role === 'ADMIN' && body.guruId) {
    resolvedGuruId = body.guruId
  }
  if (!resolvedGuruId) {
    // Find any guru as fallback for admin
    const anyGuru = await prisma.guru.findFirst()
    resolvedGuruId = anyGuru?.id
  }

  const setoran = await prisma.setoran.create({
    data: {
      siswaId,
      guruId: resolvedGuruId,
      jenis,
      surah: surah || null,
      ayatMulai: ayatMulai || null,
      ayatAkhir: ayatAkhir || null,
      halMulai: halMulai || null,
      halAkhir: halAkhir || null,
      isTasmi: isTasmi || false,
      nilaiKomponen: JSON.stringify(nilaiKomponen),
      nilaiAkhir,
      predikat: predikatData.kode,
      catatan: catatan || null,
    },
    include: {
      siswa: { select: { nama: true, kelas: true } },
      guru:  { include: { user: { select: { name: true } } } },
    },
  })

  return NextResponse.json(setoran, { status: 201 })
}
