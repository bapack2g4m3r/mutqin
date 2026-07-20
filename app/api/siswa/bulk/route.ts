import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// POST /api/siswa/bulk — bulk import siswa dari CSV/XLSX
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
  const { rows } = body // { nis, nisn, nama, kelas, namaOrtu, password }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Data tidak boleh kosong' }, { status: 400 })
  }

  // Fetch all Kelas to map nama kelas to id
  const dbKelas = await prisma.kelas.findMany()
  const mapKelas = new Map(dbKelas.map(k => [k.nama.toUpperCase(), k.id]))

  const allNis = rows.map((r: any) => String(r.nis).trim())
  const allNisn = rows.filter((r: any) => !!r.nisn).map((r: any) => String(r.nisn).trim())

  const orCondition: any[] = [{ nis: { in: allNis } }]
  if (allNisn.length > 0) {
    orCondition.push({ nisn: { in: allNisn } })
  }

  const existing = await prisma.siswa.findMany({
    where: { OR: orCondition },
    select: { nis: true, nisn: true },
  })
  const existingNis = new Set(existing.map(s => s.nis))
  const existingNisn = new Set(existing.map(s => s.nisn).filter(Boolean))

  const toCreate = rows.filter((r: any) => {
    const nis = String(r.nis).trim()
    const nisn = r.nisn ? String(r.nisn).trim() : null
    return !existingNis.has(nis) && (!nisn || !existingNisn.has(nisn))
  })
  const skipped = rows.filter((r: any) => !toCreate.includes(r))

  let created = 0
  const errors: string[] = []

  for (const r of toCreate) {
    try {
      const nis = String(r.nis).trim()
      const nisn = r.nisn ? String(r.nisn).trim() : null
      const nama = String(r.nama).trim()
      const kelasStr = String(r.kelas).trim().toUpperCase()
      const kelasId = mapKelas.get(kelasStr)
      
      if (!kelasId) {
        errors.push(`Kelas "${kelasStr}" tidak ditemukan di database. (Siswa: ${nama})`)
        continue
      }

      let ortuId = undefined
      if (r.namaOrtu && r.password) {
        const username = nisn || nis
        const hashedPassword = await hash(String(r.password).trim(), 10)
        const user = await prisma.user.create({
          data: {
            name: String(r.namaOrtu).trim(),
            username,
            password: hashedPassword,
            role: 'ORTU',
            ortu: { create: {} }
          },
          include: { ortu: true }
        })
        if (user.ortu) ortuId = user.ortu.id
      }

      await prisma.siswa.create({
        data: {
          nis, nisn, nama, kelas: kelasStr, kelasId, ortuId
        }
      })
      created++
    } catch (e: any) {
      errors.push(`Gagal import ${r.nama}: ${e.message}`)
    }
  }

    return NextResponse.json({
      created,
      skipped: skipped.length,
      skippedNis: skipped.map((r: any) => r.nis),
      errors,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
