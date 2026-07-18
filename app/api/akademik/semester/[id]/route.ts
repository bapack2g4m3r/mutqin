import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'ADMIN'
}

// PUT /api/akademik/semester/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { setAktif, tanggalMulai, tanggalAkhir } = body

  if (setAktif) {
    await prisma.$transaction([
      prisma.semester.updateMany({ data: { isAktif: false } }),
      prisma.semester.update({ where: { id }, data: { isAktif: true } }),
    ])
  }

  const updated = await prisma.semester.update({
    where: { id },
    data: {
      tanggalMulai: tanggalMulai !== undefined ? (tanggalMulai ? new Date(tanggalMulai) : null) : undefined,
      tanggalAkhir: tanggalAkhir !== undefined ? (tanggalAkhir ? new Date(tanggalAkhir) : null) : undefined,
    },
  })
  return NextResponse.json(updated)
}

// DELETE /api/akademik/semester/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const sem = await prisma.semester.findUnique({
    where: { id },
    include: { _count: { select: { setorans: true } } },
  })
  if (!sem) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  if (sem.isAktif) return NextResponse.json({ error: 'Tidak dapat menghapus semester aktif' }, { status: 400 })
  if (sem._count.setorans > 0) {
    return NextResponse.json({ error: `Semester ini memiliki ${sem._count.setorans} data setoran` }, { status: 400 })
  }

  await prisma.semester.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
