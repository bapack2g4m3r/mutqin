import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/guru/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const guru = await prisma.guru.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })
  if (!guru) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })
  return NextResponse.json(guru)
}

// PUT /api/guru/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { nama, email, password, nip, kelas } = body

  const guru = await prisma.guru.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!guru) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })

  if (email && email !== guru.user.email) {
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 409 })
  }

  const userUpdateData: any = {}
  if (nama)  userUpdateData.name  = nama
  if (email) userUpdateData.email = email
  if (password && password.length >= 6) {
    userUpdateData.password = await bcrypt.hash(password, 10)
  }

  const [updatedGuru] = await prisma.$transaction([
    prisma.guru.update({
      where: { id },
      data: {
        nip: nip !== undefined ? (nip || null) : undefined,
        kelas: kelas !== undefined ? JSON.stringify(kelas) : undefined,
        user: { update: userUpdateData },
      },
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  return NextResponse.json(updatedGuru)
}

// DELETE /api/guru/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const guru = await prisma.guru.findUnique({
    where: { id },
    include: { _count: { select: { setorans: true } } },
  })
  if (!guru) return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })

  if (guru._count.setorans > 0) {
    return NextResponse.json({
      error: `Guru ini memiliki ${guru._count.setorans} data setoran. Hapus setoran terlebih dahulu.`,
    }, { status: 400 })
  }

  await prisma.guru.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
