import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const kelas = await prisma.kelas.findUnique({
    where: { id },
    include: {
      halaqahs: { include: { guru: { include: { user: true } } } },
      siswa: { orderBy: { nama: 'asc' }, include: { halaqah: true } }
    }
  })

  if (!kelas) return NextResponse.json({ error: 'Kelas not found' }, { status: 404 })

  return NextResponse.json(kelas)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const { assignments } = await req.json() // format: { siswaId: halaqahId | null }

  if (typeof assignments !== 'object') return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  // Bulk update
  const promises = Object.keys(assignments).map(siswaId => {
    return prisma.siswa.update({
      where: { id: siswaId },
      data: { halaqahId: assignments[siswaId] || null }
    })
  })

  await Promise.all(promises)

  return NextResponse.json({ success: true })
}
