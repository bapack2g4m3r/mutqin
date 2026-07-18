import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'ADMIN'
}

// PUT /api/akademik/tahun-ajaran/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { setAktif, nama } = body

  if (setAktif) {
    await prisma.$transaction([
      prisma.tahunAjaran.updateMany({ data: { isAktif: false } }),
      prisma.tahunAjaran.update({ where: { id }, data: { isAktif: true } }),
    ])
  }

  const updated = await prisma.tahunAjaran.update({
    where: { id },
    data: nama ? { nama } : {},
    include: { semesters: true, kelas: true },
  })
  return NextResponse.json(updated)
}

// DELETE /api/akademik/tahun-ajaran/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const ta = await prisma.tahunAjaran.findUnique({
    where: { id },
    include: { _count: { select: { semesters: true, kelas: true } } },
  })
  if (!ta) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  if (ta.isAktif) return NextResponse.json({ error: 'Tidak dapat menghapus tahun ajaran aktif' }, { status: 400 })

  await prisma.tahunAjaran.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
