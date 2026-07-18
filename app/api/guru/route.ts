import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/guru — list guru
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gurus = await prisma.guru.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      setorans: { select: { id: true } },
    },
    orderBy: { user: { name: 'asc' } },
  })
  return NextResponse.json({ gurus })
}

// POST /api/guru — buat guru baru (Admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { nama, email, password, nip, kelas } = body

  if (!nama || !email || !password) {
    return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        name: nama,
        email,
        password: hashed,
        role: 'GURU',
        guru: {
          create: {
            nip: nip || null,
            kelas: JSON.stringify(kelas || []),
          },
        },
      },
      include: { guru: true },
    })
    return NextResponse.json({ id: user.guru?.id, ...user.guru, user: { name: user.name, email: user.email } }, { status: 201 })
  } catch (e: any) {
    throw e
  }
}
