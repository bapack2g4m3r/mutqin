import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/setoran/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const setoran = await prisma.setoran.findUnique({
    where: { id },
    include: {
      siswa: true,
      guru: { include: { user: { select: { name: true } } } },
    },
  })
  if (!setoran) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  return NextResponse.json(setoran)
}

// PUT /api/setoran/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { nilaiKomponen, jenis, catatan, isTasmi } = body

  let nilaiAkhir = body.nilaiAkhir
  let predikat = body.predikat

  if (nilaiKomponen && jenis) {
    const { calcNilaiTahfidz, calcNilaiTahsin, getPredikat } = await import('@/lib/surah-data')
    nilaiAkhir = jenis === 'TAHFIDZ' ? calcNilaiTahfidz(nilaiKomponen) : calcNilaiTahsin(nilaiKomponen)
    predikat = getPredikat(nilaiAkhir).kode
  }

  const setoran = await prisma.setoran.update({
    where: { id },
    data: {
      nilaiKomponen: nilaiKomponen ? JSON.stringify(nilaiKomponen) : undefined,
      nilaiAkhir,
      predikat,
      catatan,
      isTasmi,
    },
  })
  return NextResponse.json(setoran)
}

// DELETE /api/setoran/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.setoran.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
