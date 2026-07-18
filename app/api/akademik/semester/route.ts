import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'ADMIN'
}

// POST /api/akademik/semester — buat semester baru
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { nama, tahunAjaranId, tanggalMulai, tanggalAkhir } = await req.json()
  if (!nama || !tahunAjaranId) return NextResponse.json({ error: 'Nama dan tahun ajaran wajib' }, { status: 400 })
  if (!['Ganjil', 'Genap'].includes(nama)) return NextResponse.json({ error: 'Nama semester harus Ganjil atau Genap' }, { status: 400 })

  try {
    const semester = await prisma.semester.create({
      data: {
        nama, tahunAjaranId, isAktif: false,
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : null,
        tanggalAkhir: tanggalAkhir ? new Date(tanggalAkhir) : null,
      },
    })
    return NextResponse.json(semester, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Semester sudah ada di tahun ajaran ini' }, { status: 409 })
    throw e
  }
}
