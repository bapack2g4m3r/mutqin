import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/siswa/bulk — bulk import siswa dari CSV
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { rows } = body // Array of { nis, nama, kelas }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Data tidak boleh kosong' }, { status: 400 })
  }

  // Validate rows
  const invalid: number[] = []
  const KELAS_VALID = ['7A','7B','7C','7D','8A','8B','8C','8D','9A','9B','9C','9D']
  rows.forEach((r: any, i: number) => {
    if (!r.nis || !r.nama || !r.kelas) invalid.push(i + 1)
    else if (!KELAS_VALID.includes(r.kelas.toUpperCase())) invalid.push(i + 1)
  })
  if (invalid.length > 0) {
    return NextResponse.json({
      error: `Baris ${invalid.join(', ')} tidak valid. Pastikan NIS, Nama, dan Kelas (7A-9D) terisi.`,
    }, { status: 400 })
  }

  // Get existing NIS to detect duplicates
  const allNis = rows.map((r: any) => String(r.nis).trim())
  const existing = await prisma.siswa.findMany({
    where: { nis: { in: allNis } },
    select: { nis: true },
  })
  const existingNis = new Set(existing.map(s => s.nis))

  const toCreate = rows.filter((r: any) => !existingNis.has(String(r.nis).trim()))
  const skipped  = rows.filter((r: any) =>  existingNis.has(String(r.nis).trim()))

  let created = 0
  const errors: string[] = []

  if (toCreate.length > 0) {
    try {
      const result = await prisma.siswa.createMany({
        data: toCreate.map((r: any) => ({
          nis:   String(r.nis).trim(),
          nama:  String(r.nama).trim(),
          kelas: String(r.kelas).trim().toUpperCase(),
        })),
        skipDuplicates: true,
      })
      created = result.count
    } catch (e: any) {
      errors.push(e.message)
    }
  }

  return NextResponse.json({
    created,
    skipped: skipped.length,
    skippedNis: skipped.map((r: any) => r.nis),
    errors,
  })
}
