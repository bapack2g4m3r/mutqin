import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPredikat } from '@/lib/surah-data'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: siswaId } = await params
  if (!siswaId) return NextResponse.json({ error: 'Siswa ID required' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const semesterId = searchParams.get('semesterId')

  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    include: {
      kelasRef: { include: { tahunAjaran: true } },
      halaqah: { include: { guru: { include: { user: true } } } }
    }
  })

  if (!siswa) return NextResponse.json({ error: 'Siswa not found' }, { status: 404 })

  const whereSetoran: any = { siswaId }
  if (semesterId) whereSetoran.semesterId = semesterId

  const setorans = await prisma.setoran.findMany({
    where: whereSetoran
  })

  const tahfidz = setorans.filter(s => s.jenis === 'TAHFIDZ')
  const tahsin = setorans.filter(s => s.jenis === 'TAHSIN')

  // Calculate Averages for Tahfidz
  const tKelancaran = tahfidz.map(s => JSON.parse(s.nilaiKomponen).kelancaran || 0)
  const tTajwid = tahfidz.map(s => JSON.parse(s.nilaiKomponen).tajwid || 0)
  const tMakhorij = tahfidz.map(s => JSON.parse(s.nilaiKomponen).makhorijulHuruf || 0)
  
  const avgKelancaranTf = tKelancaran.length ? Math.round(tKelancaran.reduce((a,b)=>a+b,0) / tKelancaran.length) : 0
  const avgTajwidTf = tTajwid.length ? Math.round(tTajwid.reduce((a,b)=>a+b,0) / tTajwid.length) : 0
  const avgMakhorijTf = tMakhorij.length ? Math.round(tMakhorij.reduce((a,b)=>a+b,0) / tMakhorij.length) : 0
  
  const nilaiAkhirTf = avgKelancaranTf || avgTajwidTf || avgMakhorijTf 
    ? Math.round((avgKelancaranTf * 0.4) + (avgTajwidTf * 0.4) + (avgMakhorijTf * 0.2)) : 0

  // Calculate Averages for Tahsin
  const tsMakhorij = tahsin.map(s => JSON.parse(s.nilaiKomponen).makhorijulHuruf || 0)
  const tsSifat = tahsin.map(s => JSON.parse(s.nilaiKomponen).sifatulHuruf || 0)
  const tsMad = tahsin.map(s => JSON.parse(s.nilaiKomponen).ahkamulMad || 0)
  const tsWaqaf = tahsin.map(s => JSON.parse(s.nilaiKomponen).ahkamulWaqaf || 0)

  const avgMakhorijTs = tsMakhorij.length ? Math.round(tsMakhorij.reduce((a,b)=>a+b,0) / tsMakhorij.length) : 0
  const avgSifatTs = tsSifat.length ? Math.round(tsSifat.reduce((a,b)=>a+b,0) / tsSifat.length) : 0
  const avgMadTs = tsMad.length ? Math.round(tsMad.reduce((a,b)=>a+b,0) / tsMad.length) : 0
  const avgWaqafTs = tsWaqaf.length ? Math.round(tsWaqaf.reduce((a,b)=>a+b,0) / tsWaqaf.length) : 0

  const nilaiAkhirTs = avgMakhorijTs || avgSifatTs || avgMadTs || avgWaqafTs
    ? Math.round((avgMakhorijTs + avgSifatTs + avgMadTs + avgWaqafTs) / 4) : 0

  return NextResponse.json({
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
  })
}
