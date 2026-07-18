import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcProgress } from '@/lib/surah-data'

// GET /api/siswa/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const siswa = await prisma.siswa.findUnique({
    where: { id },
    include: {
      ortu: { include: { user: { select: { name: true, email: true } } } },
      setorans: {
        orderBy: { tanggal: 'desc' },
        include: {
          guru: { include: { user: { select: { name: true } } } },
        },
      },
    },
  })

  if (!siswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })

  // Calculate progress
  const surahSelesai = siswa.setorans
    .filter(s => s.jenis === 'TAHFIDZ' && s.surah)
    .map(s => s.surah as string)
  const progress = calcProgress(surahSelesai)
  const hasTasmi = siswa.setorans.some(s => s.isTasmi)

  return NextResponse.json({ ...siswa, progress, hasTasmi, surahSelesai: [...new Set(surahSelesai)] })
}

// PUT /api/siswa/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const siswa = await prisma.siswa.update({
    where: { id },
    data: body,
  })
  return NextResponse.json(siswa)
}

// DELETE /api/siswa/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as any).role
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.siswa.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
