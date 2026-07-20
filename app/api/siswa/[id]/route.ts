import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcProgress } from '@/lib/surah-data'
import { hash } from 'bcryptjs'

// GET /api/siswa/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const siswa = await prisma.siswa.findUnique({
    where: { id },
    include: {
      ortu: { include: { user: { select: { name: true, email: true, username: true } } } },
      setorans: {
        orderBy: { tanggal: 'desc' },
        include: {
          guru: { include: { user: { select: { name: true } } } },
        },
      },
    },
  })

  if (!siswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })

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
  const { nis, nisn, nama, kelas, kelasId, namaOrtu, password } = body

  const existingSiswa = await prisma.siswa.findUnique({ where: { id }, include: { ortu: { include: { user: true } } } })
  if (!existingSiswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })

  let ortuId = existingSiswa.ortuId

  // Update or create Ortu
  if (namaOrtu || password) {
    if (ortuId && existingSiswa.ortu) {
       const updateData: any = {}
       if (namaOrtu) updateData.name = namaOrtu
       if (password) updateData.password = await hash(password, 10)
       if (nisn || nis) updateData.username = nisn || nis
       await prisma.user.update({
         where: { id: existingSiswa.ortu.userId },
         data: updateData
       })
    } else {
       if (namaOrtu && password) {
         const username = nisn || nis
         const hashedPassword = await hash(password, 10)
         const user = await prisma.user.create({
           data: { name: namaOrtu, username, password: hashedPassword, role: 'ORTU', ortu: { create: {} } },
           include: { ortu: true }
         })
         if (user.ortu) ortuId = user.ortu.id
       }
    }
  }

  const dataSiswa: any = { nis, nisn, nama, kelas }
  if (kelasId !== undefined) dataSiswa.kelasId = kelasId
  if (ortuId) dataSiswa.ortuId = ortuId

  try {
    const siswa = await prisma.siswa.update({ where: { id }, data: dataSiswa })
    return NextResponse.json(siswa)
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'NIS atau NISN sudah digunakan' }, { status: 409 })
    throw e
  }
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
