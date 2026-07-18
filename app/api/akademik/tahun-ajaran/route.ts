import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'ADMIN'
}

// POST /api/akademik/tahun-ajaran — buat tahun ajaran baru
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { nama } = await req.json()
  if (!nama || !/^\d{4}\/\d{4}$/.test(nama)) {
    return NextResponse.json({ error: 'Format nama harus YYYY/YYYY, contoh: 2025/2026' }, { status: 400 })
  }

  try {
    const ta = await prisma.tahunAjaran.create({ data: { nama, isAktif: false } })
    return NextResponse.json(ta, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Tahun ajaran sudah ada' }, { status: 409 })
    throw e
  }
}
