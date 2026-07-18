import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'ADMIN'
}

// POST /api/akademik/kelas — buat kelas baru
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { nama, tingkat, tahunAjaranId, waliKelasId } = await req.json()
  if (!nama || !tingkat || !tahunAjaranId) {
    return NextResponse.json({ error: 'Nama, tingkat, dan tahun ajaran wajib' }, { status: 400 })
  }

  const jumlahSiswa = await prisma.siswa.count({ where: { kelas: nama } })

  try {
    const kelas = await prisma.kelas.create({
      data: {
        nama, tingkat: Number(tingkat), tahunAjaranId,
        waliKelasId: waliKelasId || null,
        jumlahSiswa,
      },
      include: {
        waliKelas: { include: { user: { select: { name: true } } } },
      },
    })
    return NextResponse.json(kelas, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Kelas sudah ada di tahun ajaran ini' }, { status: 409 })
    throw e
  }
}
