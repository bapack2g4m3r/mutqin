import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPredikat } from '@/lib/surah-data'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { siswaIds, kelas, jenjang, semesterId } = body

    const where: any = {}

    if (siswaIds && Array.isArray(siswaIds) && siswaIds.length > 0) {
      where.id = { in: siswaIds }
    } else {
      if (kelas) {
        where.kelas = kelas
      }
      if (jenjang) {
        // e.g. jenjang 7 -> kelas startsWith '7' or kelasRef.tingkat = 7
        where.OR = [
          { kelas: { startsWith: String(jenjang) } },
          { kelasRef: { tingkat: Number(jenjang) } }
        ]
      }
    }

    const siswaList = await prisma.siswa.findMany({
      where,
      include: {
        kelasRef: { include: { tahunAjaran: true } },
        halaqah: { include: { guru: { include: { user: true } } } }
      },
      orderBy: [
        { kelas: 'asc' },
        { nama: 'asc' }
      ]
    })

    if (siswaList.length === 0) {
      return NextResponse.json({ results: [], count: 0 })
    }

    // Determine active semester name
    let activeSemesterName = 'GANJIL'
    const activeTa = await prisma.tahunAjaran.findFirst({
      where: { isAktif: true },
      include: { semesters: true }
    })
    if (activeTa) {
      const activeSem = activeTa.semesters.find(s => s.isAktif)
      if (activeSem) activeSemesterName = activeSem.nama.toUpperCase()
    }

    const allSiswaIds = siswaList.map(s => s.id)
    const whereSetoran: any = { siswaId: { in: allSiswaIds } }
    if (semesterId) whereSetoran.semesterId = semesterId

    const allSetorans = await prisma.setoran.findMany({
      where: whereSetoran
    })

    // Group setorans by siswaId
    const setoranMap = new Map<string, typeof allSetorans>()
    for (const s of allSetorans) {
      if (!setoranMap.has(s.siswaId)) setoranMap.set(s.siswaId, [])
      setoranMap.get(s.siswaId)!.push(s)
    }

    const results = siswaList.map(siswa => {
      const setorans = setoranMap.get(siswa.id) || []
      const tahfidz = setorans.filter(s => s.jenis === 'TAHFIDZ')
      const tahsin = setorans.filter(s => s.jenis === 'TAHSIN')

      // Calculate Averages for Tahfidz
      const tKelancaran = tahfidz.map(s => {
        try { return JSON.parse(s.nilaiKomponen).kelancaran || 0 } catch { return 0 }
      })
      const tTajwid = tahfidz.map(s => {
        try { return JSON.parse(s.nilaiKomponen).tajwid || 0 } catch { return 0 }
      })
      const tMakhorij = tahfidz.map(s => {
        try { return JSON.parse(s.nilaiKomponen).makhorijulHuruf || 0 } catch { return 0 }
      })

      const avgKelancaranTf = tKelancaran.length ? Math.round(tKelancaran.reduce((a, b) => a + b, 0) / tKelancaran.length) : 0
      const avgTajwidTf = tTajwid.length ? Math.round(tTajwid.reduce((a, b) => a + b, 0) / tTajwid.length) : 0
      const avgMakhorijTf = tMakhorij.length ? Math.round(tMakhorij.reduce((a, b) => a + b, 0) / tMakhorij.length) : 0

      const nilaiAkhirTf = avgKelancaranTf || avgTajwidTf || avgMakhorijTf
        ? Math.round((avgKelancaranTf * 0.4) + (avgTajwidTf * 0.4) + (avgMakhorijTf * 0.2)) : 0

      // Calculate Averages for Tahsin
      const tsMakhorij = tahsin.map(s => {
        try { return JSON.parse(s.nilaiKomponen).makhorijulHuruf || 0 } catch { return 0 }
      })
      const tsSifat = tahsin.map(s => {
        try { return JSON.parse(s.nilaiKomponen).sifatulHuruf || 0 } catch { return 0 }
      })
      const tsMad = tahsin.map(s => {
        try { return JSON.parse(s.nilaiKomponen).ahkamulMad || 0 } catch { return 0 }
      })
      const tsWaqaf = tahsin.map(s => {
        try { return JSON.parse(s.nilaiKomponen).ahkamulWaqaf || 0 } catch { return 0 }
      })

      const avgMakhorijTs = tsMakhorij.length ? Math.round(tsMakhorij.reduce((a, b) => a + b, 0) / tsMakhorij.length) : 0
      const avgSifatTs = tsSifat.length ? Math.round(tsSifat.reduce((a, b) => a + b, 0) / tsSifat.length) : 0
      const avgMadTs = tsMad.length ? Math.round(tsMad.reduce((a, b) => a + b, 0) / tsMad.length) : 0
      const avgWaqafTs = tsWaqaf.length ? Math.round(tsWaqaf.reduce((a, b) => a + b, 0) / tsWaqaf.length) : 0

      const nilaiAkhirTs = avgMakhorijTs || avgSifatTs || avgMadTs || avgWaqafTs
        ? Math.round((avgMakhorijTs + avgSifatTs + avgMadTs + avgWaqafTs) / 4) : 0

      return {
        siswa,
        rapor: {
          tahfidz: {
            komponen: [
              { nama: 'Kelancaran Hafalan', kkm: 70, nilai: avgKelancaranTf, ...getPredikat(avgKelancaranTf) },
              { nama: 'Tajwid', kkm: 70, nilai: avgTajwidTf, ...getPredikat(avgTajwidTf) },
              { nama: 'Makhorijul Huruf', kkm: 70, nilai: avgMakhorijTf, ...getPredikat(avgMakhorijTf) }
            ],
            nilaiAkhir: nilaiAkhirTf,
            predikat: getPredikat(nilaiAkhirTf)
          },
          tahsin: {
            komponen: [
              { nama: 'Makhorijul Huruf', kkm: 70, nilai: avgMakhorijTs, ...getPredikat(avgMakhorijTs) },
              { nama: 'Sifatul Huruf', kkm: 70, nilai: avgSifatTs, ...getPredikat(avgSifatTs) },
              { nama: 'Ahkamul Mad', kkm: 70, nilai: avgMadTs, ...getPredikat(avgMadTs) },
              { nama: 'Ahkamul Waqaf', kkm: 70, nilai: avgWaqafTs, ...getPredikat(avgWaqafTs) }
            ],
            nilaiAkhir: nilaiAkhirTs,
            predikat: getPredikat(nilaiAkhirTs)
          }
        }
      }
    })

    return NextResponse.json({
      semester: activeSemesterName,
      count: results.length,
      results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
