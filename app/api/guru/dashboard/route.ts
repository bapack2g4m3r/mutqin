import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'GURU') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const guruId = (session.user as any).guruId
  if (!guruId) return NextResponse.json({ error: 'Guru ID not found' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')

  const today = dateParam ? new Date(dateParam) : new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  // 1. Dapatkan Halaqah milik Guru ini
  const halaqahs = await prisma.halaqah.findMany({
    where: { guruId },
    include: {
      kelas: true,
      siswa: {
        orderBy: { nama: 'asc' },
        include: {
          setorans: {
            where: { tanggal: { gte: today, lte: todayEnd } },
            take: 1
          }
        }
      }
    }
  })

  // Grouping siswa binaan by kelas
  const siswaBinaanPerKelas = halaqahs.map(h => ({
    kelas: h.kelas.nama,
    kelasId: h.kelasId,
    siswa: h.siswa.map(s => ({
      id: s.id,
      nama: s.nama,
      nis: s.nis,
      sudahSetorHariIni: s.setorans.length > 0
    }))
  }))

  const allSiswaBinaan = halaqahs.flatMap(h => h.siswa)
  const totalSiswaBinaan = allSiswaBinaan.length
  
  // Setoran hari ini dari siswa binaan
  const setoranHariIniCount = allSiswaBinaan.filter(s => s.setorans.length > 0).length
  const belumSetorCount = totalSiswaBinaan - setoranHariIniCount

  // Setoran terbaru yang diinput guru ini
  const setoranTerbaru = await prisma.setoran.findMany({
    where: { guruId },
    take: 10,
    orderBy: { tanggal: 'desc' },
    include: {
      siswa: { select: { nama: true, kelas: true, nis: true } },
      guru:  { include: { user: { select: { name: true } } } },
    },
  })

  return NextResponse.json({
    totalSiswa: totalSiswaBinaan,
    setoranHariIni: setoranHariIniCount,
    siswaBelumSetor: belumSetorCount,
    siswaBinaanPerKelas,
    setoranTerbaru,
  })
}
