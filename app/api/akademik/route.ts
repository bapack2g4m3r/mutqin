import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/akademik — fetch all academic structure
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tahunAjaranList = await prisma.tahunAjaran.findMany({
    orderBy: { nama: 'desc' },
    include: {
      semesters: { orderBy: { nama: 'asc' } },
      kelas: {
        orderBy: { nama: 'asc' },
        include: {
          waliKelas: { include: { user: { select: { name: true } } } },
        },
      },
    },
  })

  // Active semester info
  const aktivSemester = await prisma.semester.findFirst({
    where: { isAktif: true },
    include: { tahunAjaran: true },
  })

  const allGuru = await prisma.guru.findMany({
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json({ tahunAjaranList, aktivSemester, allGuru })
}
