import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcProgress } from '@/lib/surah-data'

// GET /api/siswa — list dengan filter
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const kelas  = searchParams.get('kelas')
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = parseInt(searchParams.get('limit') || '20')
  const skip   = (page - 1) * limit

  const where: any = {}
  if (kelas)  where.kelas = kelas
  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { nis:  { contains: search } },
    ]
  }

  const [siswa, total] = await Promise.all([
    prisma.siswa.findMany({
      where,
      skip,
      take: limit,
      include: {
        ortu: { include: { user: { select: { name: true, email: true } } } },
        setorans: {
          select: { jenis: true, nilaiAkhir: true, predikat: true, tanggal: true },
          orderBy: { tanggal: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ kelas: 'asc' }, { nama: 'asc' }],
    }),
    prisma.siswa.count({ where }),
  ])

  return NextResponse.json({ siswa, total, page, limit })
}

// POST /api/siswa — buat siswa baru (Admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { nis, nama, kelas } = body

  if (!nis || !nama || !kelas) {
    return NextResponse.json({ error: 'NIS, nama, dan kelas wajib diisi' }, { status: 400 })
  }

  try {
    const siswa = await prisma.siswa.create({ data: { nis, nama, kelas } })
    return NextResponse.json(siswa, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'NIS sudah digunakan' }, { status: 409 })
    throw e
  }
}
