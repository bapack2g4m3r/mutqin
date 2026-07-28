import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/backup/export
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 1. Ambil Data Siswa (beserta ortu & kelas)
    const siswa = await prisma.siswa.findMany({
      include: {
        kelasRel: true,
        ortu: { include: { user: true } },
      }
    })

    const siswaData = siswa.map(s => ({
      NIS: s.nis,
      NISN: s.nisn || '',
      'Nama Siswa': s.nama,
      'Kelas Saat Ini': s.kelas,
      'ID Kelas': s.kelasId || '',
      'Nama Orang Tua': s.ortu?.user.name || '',
      'Username Ortu': s.ortu?.user.username || '',
    }))

    // 2. Ambil Data Guru (beserta kontak)
    const guru = await prisma.guru.findMany({
      include: { user: true }
    })

    const guruData = guru.map(g => ({
      ID: g.id,
      NIP: g.nip || '',
      Nama: g.user.name,
      Email: g.user.email,
      Username: g.user.username,
    }))

    // 3. Ambil Data Akademik (Tahun Ajaran, Kelas, Halaqah)
    const tahunAjaran = await prisma.tahunAjaran.findMany({
      include: {
        semesters: true,
        kelas: {
          include: { halaqahs: { include: { guru: { include: { user: true } } } } }
        }
      }
    })

    const akademikData: any[] = []
    tahunAjaran.forEach(ta => {
      ta.kelas.forEach(k => {
        akademikData.push({
          'Tahun Ajaran': ta.nama,
          'Status TA': ta.isAktif ? 'Aktif' : 'Tidak',
          'Nama Kelas': k.nama,
          'Tingkat': k.tingkat,
          'Jumlah Siswa (Cache)': k.jumlahSiswa,
          'Guru Halaqah': k.halaqahs.map(h => h.guru.user.name).join(', '),
        })
      })
    })

    // Return full JSON so the client can generate Excel / CSV
    return NextResponse.json({
      siswa: siswaData,
      guru: guruData,
      akademik: akademikData,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Backup Error:', error)
    return NextResponse.json({ error: 'Gagal melakukan backup data' }, { status: 500 })
  }
}
