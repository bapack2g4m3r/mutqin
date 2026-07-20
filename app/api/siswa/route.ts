import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcProgress } from '@/lib/surah-data'
import { hash } from 'bcryptjs'

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
      { nisn: { contains: search } },
    ]
  }

  const userRole = (session.user as any).role
  if (userRole === 'GURU') {
    const guruId = (session.user as any).guruId
    const guru = await prisma.guru.findUnique({ where: { id: guruId }, include: { halaqahs: true } })
    if (guru && guru.halaqahs.length > 0) {
      where.halaqahId = { in: guru.halaqahs.map(h => h.id) }
    } else if (guru && guru.kelas && !kelas) {
      try {
        const arrKelas = JSON.parse(guru.kelas);
        if (Array.isArray(arrKelas) && arrKelas.length > 0) {
          where.kelas = { in: arrKelas }
        }
      } catch (e) {}
    }
  }

  const [siswa, total] = await Promise.all([
    prisma.siswa.findMany({
      where,
      skip,
      take: limit,
      include: {
        ortu: { include: { user: { select: { name: true, email: true, username: true } } } },
        kelasRef: true,
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
  const { nis, nisn, nama, kelas, kelasId, namaOrtu, password } = body

  if (!nis || !nama) {
    return NextResponse.json({ error: 'NIS dan nama wajib diisi' }, { status: 400 })
  }

  try {
    let ortuId = undefined
    // Buat akun Ortu jika diisi
    if (namaOrtu && password) {
      const username = nisn || nis
      const hashedPassword = await hash(password, 10)
      const user = await prisma.user.create({
        data: {
          name: namaOrtu,
          username,
          password: hashedPassword,
          role: 'ORTU',
          ortu: { create: {} }
        },
        include: { ortu: true }
      })
      if (user.ortu) ortuId = user.ortu.id
    }

    const dataSiswa: any = { nis, nisn, nama, kelas }
    if (kelasId) dataSiswa.kelasId = kelasId
    if (ortuId) dataSiswa.ortuId = ortuId

    const siswa = await prisma.siswa.create({ data: dataSiswa })
    return NextResponse.json(siswa, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'NIS atau NISN sudah digunakan' }, { status: 409 })
    throw e
  }
}
