import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as xlsx from 'xlsx'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'GURU') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const guruId = (session.user as any).guruId
  if (!guruId) {
    return NextResponse.json({ error: 'Guru ID not found' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  
  if (!dateParam) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  const targetDate = new Date(dateParam)
  targetDate.setHours(0, 0, 0, 0)
  const targetDateEnd = new Date(targetDate)
  targetDateEnd.setHours(23, 59, 59, 999)

  // Ambil semester aktif sebagai fallback
  const activeSemester = await prisma.semester.findFirst({
    where: { isAktif: true },
    include: { tahunAjaran: true }
  })
  
  const activeSemesterName = activeSemester 
    ? `${activeSemester.nama} ${activeSemester.tahunAjaran.nama}` 
    : '-'

  const setorans = await prisma.setoran.findMany({
    where: {
      guruId,
      tanggal: {
        gte: targetDate,
        lte: targetDateEnd
      }
    },
    include: {
      siswa: true,
      guru: { include: { user: true } },
      semester: { include: { tahunAjaran: true } }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  // Format ke baris excel
  const rows = setorans.map(s => {
    const semesterName = s.semester 
      ? `${s.semester.nama} ${s.semester.tahunAjaran.nama}` 
      : activeSemesterName

    return {
      'ID Setoran': s.id,
      'Tanggal': s.tanggal.toISOString().split('T')[0],
      'Jenis': s.jenis,
      'NIS Siswa': s.siswa.nis,
      'Nama Siswa': s.siswa.nama,
      'Guru Penilai': s.guru.user.name,
      'Semester': semesterName,
      'Surah': s.surah || '-',
      'Ayat Mulai': s.ayatMulai || '-',
      'Ayat Akhir': s.ayatAkhir || '-',
      'Buku Tahsin': s.bukuTahsin || '-',
      'Halaman Tah': s.halamanTahsin || '-',
      'Nilai Akhir': s.nilaiAkhir,
      'Predikat': s.predikat,
      'Catatan': s.catatan || ''
    }
  })

  // Buat workbook
  const worksheet = xlsx.utils.json_to_sheet(rows)
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Setoran')

  // Generate buffer excel
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  // Return file as response
  const filename = `Setoran_${dateParam}.xlsx`
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  })
}
