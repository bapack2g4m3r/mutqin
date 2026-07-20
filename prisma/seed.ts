import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { QURAN_SURAHS } from '../lib/surah-data'

const prisma = new PrismaClient()

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getPredikat(nilai: number): string {
  if (nilai >= 90) return 'MUMTAZ'
  if (nilai >= 80) return 'JAYYID_JIDDAN'
  if (nilai >= 70) return 'JAYYID'
  return 'GHAIR_MAQBUL'
}

async function main() {
  console.log('🌱 Seeding MUTQIN database...')

  // Clean
  await prisma.setoran.deleteMany()
  await prisma.siswa.deleteMany()
  await prisma.halaqah.deleteMany()
  await prisma.kelas.deleteMany()
  await prisma.semester.deleteMany()
  await prisma.tahunAjaran.deleteMany()
  
  await prisma.guru.deleteMany()
  await prisma.ortu.deleteMany()
  await prisma.user.deleteMany()

  // ====== TAHUN AJARAN & KELAS ======
  const ta = await prisma.tahunAjaran.create({
    data: { nama: '2025/2026', isAktif: true }
  })
  const semester = await prisma.semester.create({
    data: { nama: 'Ganjil', tahunAjaranId: ta.id, isAktif: true }
  })

  // ====== ADMIN ======
  await prisma.user.create({
    data: {
      email: 'admin@globalinsani.sch.id',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin Global Insani',
      role: 'ADMIN',
    },
  })

  // ====== GURU ======
  const guru1User = await prisma.user.create({
    data: {
      email: 'ustadzah.aisyah@globalinsani.sch.id',
      password: await bcrypt.hash('guru123', 10),
      name: 'Ustadzah Aisyah Mumairoh',
      role: 'GURU',
    },
  })
  const guru1 = await prisma.guru.create({
    data: { userId: guru1User.id, kelas: '[]', nip: '198501012010012001' },
  })

  const guru2User = await prisma.user.create({
    data: {
      email: 'ustad.fauzi@globalinsani.sch.id',
      password: await bcrypt.hash('guru123', 10),
      name: 'Ustad Ahmad Fauzi',
      role: 'GURU',
    },
  })
  const guru2 = await prisma.guru.create({
    data: { userId: guru2User.id, kelas: '[]', nip: '198701012012011002' },
  })

  // ====== KELAS & HALAQAH ======
  const kelas7A = await prisma.kelas.create({ data: { nama: '7A', tingkat: 7, tahunAjaranId: ta.id, waliKelasId: guru1.id } })
  const kelas7B = await prisma.kelas.create({ data: { nama: '7B', tingkat: 7, tahunAjaranId: ta.id, waliKelasId: guru2.id } })

  const halaqahAisyah7A = await prisma.halaqah.create({ data: { nama: 'Halaqah Aisyah', kelasId: kelas7A.id, guruId: guru1.id } })
  const halaqahFauzi7A = await prisma.halaqah.create({ data: { nama: 'Halaqah Fauzi', kelasId: kelas7A.id, guruId: guru2.id } })
  const halaqahAisyah7B = await prisma.halaqah.create({ data: { nama: 'Halaqah Aisyah', kelasId: kelas7B.id, guruId: guru1.id } })

  // ====== SISWA (20 orang) ======
  const siswaList = [
    { nama: 'Ahmad Fauzan',     nis: '2500000001', halaqahId: halaqahFauzi7A.id, kelasId: kelas7A.id },
    { nama: 'Fatih Arkan',      nis: '2500000002', halaqahId: halaqahFauzi7A.id, kelasId: kelas7A.id },
    { nama: 'Bilal Ramadhan',   nis: '2500000003', halaqahId: halaqahFauzi7A.id, kelasId: kelas7A.id },
    { nama: 'Darisah Ali',      nis: '2500000004', halaqahId: halaqahAisyah7A.id, kelasId: kelas7A.id },
    { nama: 'Hafidh Nur',       nis: '2500000005', halaqahId: halaqahAisyah7A.id, kelasId: kelas7A.id },
    { nama: 'Aisyah Mumairoh',  nis: '2500000006', halaqahId: halaqahAisyah7B.id, kelasId: kelas7B.id },
    { nama: 'Zainab Kartika',   nis: '2500000007', halaqahId: halaqahAisyah7B.id, kelasId: kelas7B.id },
  ]

  const ortuNames = [
    'Bapak Fauzan', 'Bapak Arkan', 'Bapak Ramadhan', 'Bapak Ali', 'Bapak Nur',
    'Bapak Mumair', 'Bapak Kartika'
  ]

  const createdSiswa = []
  
  // Create special ortu for Ahmad Fauzan (demo account using NIS 1234567890)
  const demoOrtuUser = await prisma.user.create({
    data: {
      username: '1234567890', // NIS login
      email: 'ortu.ahmad@globalinsani.sch.id', // Keep email for reference
      password: await bcrypt.hash('1234567890', 10), // NIS password
      name: 'Bapak Ahmad Fauzan',
      role: 'ORTU',
    },
  })
  const demoOrtu = await prisma.ortu.create({
    data: { userId: demoOrtuUser.id }
  })

  for (let i = 0; i < siswaList.length; i++) {
    const s = siswaList[i]
    let ortuId = null

    if (i === 0) {
      ortuId = demoOrtu.id
      s.nis = '1234567890'
    } else {
      const ortuUser = await prisma.user.create({
        data: {
          username: s.nis, // NIS as username
          password: await bcrypt.hash(s.nis, 10), // NIS as password
          name: ortuNames[i],
          role: 'ORTU',
        },
      })
      const ortu = await prisma.ortu.create({ data: { userId: ortuUser.id } })
      ortuId = ortu.id
    }

    const siswa = await prisma.siswa.create({
      data: { nis: s.nis, nama: s.nama, kelasId: s.kelasId, halaqahId: s.halaqahId, ortuId },
    })
    createdSiswa.push(siswa)
  }

  // ====== SETORAN SAMPLE ======
  for (const siswa of createdSiswa) {
    // Get guruId from halaqah
    let guruId = guru1.id
    if (siswa.halaqahId === halaqahFauzi7A.id) guruId = guru2.id

    const numSetorans = rnd(2, 5)

    for (let j = 0; j < numSetorans; j++) {
      // Pick random surah from Juz 30 (index 77 to 113 in QURAN_SURAHS)
      const surahIndex = rnd(77, 113)
      const surah = QURAN_SURAHS[surahIndex]
      const daysAgo = rnd(0, 30)
      const tanggal = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

      // Tahfidz
      const kelancaran = rnd(70, 100)
      const tajwid = rnd(70, 100)
      const makhorij = rnd(70, 100)
      const nilaiTahfidz = Math.round(kelancaran * 0.4 + tajwid * 0.4 + makhorij * 0.2)

      await prisma.setoran.create({
        data: {
          siswaId: siswa.id,
          guruId: guruId,
          semesterId: semester.id,
          jenis: 'TAHFIDZ',
          surah: surah.nama,
          ayatMulai: 1,
          ayatAkhir: rnd(5, 40),
          halMulai: surah.halMulai,
          halAkhir: surah.halMulai,
          isTasmi: false,
          nilaiKomponen: JSON.stringify({ kelancaran, tajwid, makhorijulHuruf: makhorij }),
          nilaiAkhir: nilaiTahfidz,
          predikat: getPredikat(nilaiTahfidz),
          catatan: nilaiTahfidz >= 90 ? 'Lancar, tajwid bagus' : 'Perlu latihan lagi',
          tanggal,
        },
      })

      // Tahsin
      if (j % 2 === 0) {
        const mkh = rnd(70, 100)
        const sfh = rnd(70, 100)
        const mad = rnd(70, 100)
        const wqf = rnd(70, 100)
        const nilaiTahsin = Math.round((mkh + sfh + mad + wqf) / 4)

        await prisma.setoran.create({
          data: {
            siswaId: siswa.id,
            guruId: guruId,
            semesterId: semester.id,
            jenis: 'TAHSIN',
            bukuTahsin: 'Metode Ummi Jilid 4',
            halamanTahsin: '12-13',
            nilaiKomponen: JSON.stringify({
              makhorijulHuruf: mkh,
              sifatulHuruf: sfh,
              ahkamulMad: mad,
              ahkamulWaqaf: wqf
            }),
            nilaiAkhir: nilaiTahsin,
            predikat: getPredikat(nilaiTahsin),
            catatan: 'Perlu latihan mad thobi\'i',
            tanggal: new Date(tanggal.getTime() + 60 * 60 * 1000),
          },
        })
      }
    }
  }

  console.log('✅ Seed selesai!')
  console.log('\n📝 Login Credentials:')
  console.log('👤 Admin:  admin@globalinsani.sch.id / admin123')
  console.log('👨‍🏫 Guru 1: ustadzah.aisyah@globalinsani.sch.id / guru123')
  console.log('👨‍🏫 Guru 2: ustad.fauzi@globalinsani.sch.id / guru123')
  console.log('👪 Ortu:   1234567890 / 1234567890 ATAU 2500000002 / 2500000002')
}

main().catch(console.error).finally(() => prisma.$disconnect())
