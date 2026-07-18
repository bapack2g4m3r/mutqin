import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'ADMIN'
}

// PUT /api/akademik/kelas/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { nama, tingkat, waliKelasId } = await req.json()

  const kelasRecord = await prisma.kelas.findUnique({ where: { id } })
  if (!kelasRecord) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  const kelasNama = nama || kelasRecord.nama
  const jumlahSiswa = await prisma.siswa.count({ where: { kelas: kelasNama } })

  const updated = await prisma.kelas.update({
    where: { id },
    data: {
      nama: nama || undefined,
      tingkat: tingkat ? Number(tingkat) : undefined,
      waliKelasId: waliKelasId !== undefined ? (waliKelasId || null) : undefined,
      jumlahSiswa,
    },
    include: {
      waliKelas: { include: { user: { select: { name: true } } } },
    },
  })
  return NextResponse.json(updated)
}

// DELETE /api/akademik/kelas/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.kelas.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
