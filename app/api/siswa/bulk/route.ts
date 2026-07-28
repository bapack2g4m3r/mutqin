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
  const allUsernames = rows.map((r: any) => r.nisn ? String(r.nisn).trim() : String(r.nis).trim())

  // Pre-fetch all existing Siswa
  const existingSiswaList = await prisma.siswa.findMany({
    where: { nis: { in: allNis } },
    select: { id: true, nis: true, nisn: true, ortuId: true },
  })
  const existingByNis = new Map(existingSiswaList.map(s => [s.nis, s]))

  // Pre-fetch all existing Parent Users
  const existingUsersList = await prisma.user.findMany({
    where: { username: { in: allUsernames } },
    include: { ortu: true }
  })
  const existingUsersByUsername = new Map(existingUsersList.map(u => [u.username, u]))

  let created = 0
  let updated = 0
  const errors: string[] = []

  // Process in chunks to prevent Vercel/Prisma connection limits
  const chunkSize = 25
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)

    await Promise.all(chunk.map(async (r: any) => {
      try {
        const nis = String(r.nis).trim()
        const nisn = r.nisn ? String(r.nisn).trim() : null
        const nama = String(r.nama).trim()
        const kelasStr = String(r.kelas).trim().toUpperCase()
        const kelasId = mapKelas.get(kelasStr)
        
        if (!kelasId) {
          errors.push(`Kelas "${kelasStr}" tidak ditemukan di database. (Siswa: ${nama})`)
          return
        }

        let ortuId = undefined
        if (r.namaOrtu && r.password) {
          const username = nisn || nis
          const user = existingUsersByUsername.get(username)
          
          // Use salt rounds 8 for faster bulk hashing in serverless (still secure enough for school apps)
          const hashedPassword = await hash(String(r.password).trim(), 8)
          
          if (user) {
            // Update existing Ortu User
            await prisma.user.update({
              where: { id: user.id },
              data: { name: String(r.namaOrtu).trim(), password: hashedPassword }
            })
            if (user.ortu) {
              ortuId = user.ortu.id
            } else {
              const newOrtu = await prisma.ortu.create({ data: { userId: user.id } })
              ortuId = newOrtu.id
            }
          } else {
            // Create new Ortu User
            const newUser = await prisma.user.create({
              data: {
                name: String(r.namaOrtu).trim(),
                username,
                password: hashedPassword,
                role: 'ORTU',
                ortu: { create: {} }
              },
              include: { ortu: true }
            })
            if (newUser.ortu) ortuId = newUser.ortu.id
          }
        }

        const existingSiswa = existingByNis.get(nis)

        if (existingSiswa) {
          // UPDATE (Upsert logic)
          const finalOrtuId = ortuId || existingSiswa.ortuId
          await prisma.siswa.update({
            where: { id: existingSiswa.id },
            data: {
              nisn,
              nama,
              kelas: kelasStr,
              kelasId,
              ortuId: finalOrtuId
            }
          })
          updated++
        } else {
          // CREATE
          await prisma.siswa.create({
            data: {
              nis,
              nisn,
              nama,
              kelas: kelasStr,
              kelasId,
              ortuId
            }
          })
          created++
        }
      } catch (e: any) {
        if (e.code === 'P2002') {
          errors.push(`Gagal import ${r.nama}: NIS/NISN atau Username sudah digunakan oleh entri lain.`)
        } else {
          errors.push(`Gagal import ${r.nama}: ${e.message}`)
        }
      }
    }))
  }

    return NextResponse.json({
      created,
      updated,
      skipped: 0,
      errors,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
