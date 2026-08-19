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
  const existing = await prisma.setoran.findUnique({ where: { id }, include: { siswa: true } })
  if (!existing) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  const role = (session.user as any).role
  const guruId = (session.user as any).guruId
  if (role !== 'ADMIN' && existing.guruId !== guruId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { 
    jenis, surah, ayatMulai, ayatAkhir, halMulai, halAkhir, isTasmi, 
    bukuTahsin, halamanTahsin, nilaiKomponen, catatan, tanggal 
  } = body

  let nilaiAkhir = body.nilaiAkhir || existing.nilaiAkhir
  let predikat = body.predikat || existing.predikat

  if (nilaiKomponen && jenis) {
    const { calcNilaiTahfidz, calcNilaiTahsin, getPredikat } = await import('@/lib/surah-data')
    nilaiAkhir = jenis === 'TAHFIDZ' ? calcNilaiTahfidz(nilaiKomponen) : calcNilaiTahsin(nilaiKomponen)
    predikat = getPredikat(nilaiAkhir).kode
  }

  let finalSemesterId = existing.semesterId
  if (!finalSemesterId) {
    const activeSemester = await prisma.semester.findFirst({
      where: { isAktif: true },
      select: { id: true }
    })
    finalSemesterId = activeSemester?.id || null
  }

  const setoran = await prisma.setoran.update({
    where: { id },
    data: {
      semesterId: finalSemesterId,
      surah: surah !== undefined ? surah : undefined,
      ayatMulai: ayatMulai !== undefined ? ayatMulai : undefined,
      ayatAkhir: ayatAkhir !== undefined ? ayatAkhir : undefined,
      halMulai: halMulai !== undefined ? halMulai : undefined,
      halAkhir: halAkhir !== undefined ? halAkhir : undefined,
      isTasmi: isTasmi !== undefined ? isTasmi : undefined,
      bukuTahsin: bukuTahsin !== undefined ? bukuTahsin : undefined,
      halamanTahsin: halamanTahsin !== undefined ? halamanTahsin : undefined,
      nilaiKomponen: nilaiKomponen ? JSON.stringify(nilaiKomponen) : undefined,
      nilaiAkhir,
      predikat,
      catatan: catatan !== undefined ? catatan : undefined,
      tanggal: tanggal ? new Date(tanggal) : undefined,
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'UPDATE_SETORAN',
      description: `Mengedit setoran ${jenis || existing.jenis} untuk siswa ${existing.siswa.nama}`
    }
  })

  return NextResponse.json(setoran)
}

// DELETE /api/setoran/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.setoran.findUnique({ where: { id }, include: { siswa: true } })
  if (!existing) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  const role = (session.user as any).role
  const guruId = (session.user as any).guruId
  if (role !== 'ADMIN' && existing.guruId !== guruId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const setoran = await prisma.setoran.delete({
      where: { id },
      include: { siswa: true }
    })

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'DELETE_SETORAN',
        description: `Menghapus setoran milik siswa ${setoran.siswa.nama}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 })
  }
}
