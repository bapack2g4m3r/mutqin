import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const JUZ30_SURAHS = [
  "An-Naba'", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infithar",
  "Al-Muthaffifin", "Al-Insyiqaq", "Al-Buruj", "At-Thariq", "Al-A'la",
  "Al-Ghasyiyah", "Al-Fajr", "Al-Balad", "Asy-Syams", "Al-Lail",
  "Adh-Dhuha", "Al-Insyirah", "At-Tin", "Al-'Alaq", "Al-Qadr",
  "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takatsur",
  "Al-'Ashr", "Al-Humazah", "Al-Fil", "Quraisy", "Al-Ma'un",
  "Al-Kautsar", "Al-Kafirun", "An-Nashr", "Al-Masad", "Al-Ikhlas",
  "Al-Falaq", "An-Naas"
]

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
  await prisma.guru.deleteMany()
  await prisma.ortu.deleteMany()
  await prisma.user.deleteMany()

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
    data: { userId: guru1User.id, kelas: JSON.stringify(['7A', '7B', '8A']), nip: '198501012010012001' },
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
    data: { userId: guru2User.id, kelas: JSON.stringify(['8B', '9A', '9B']), nip: '198701012012011002' },
  })

  // ====== SISWA (20 orang) ======
  const siswaList = [
    { nama: 'Ahmad Fauzan',     nis: '25071', kelas: '7A' },
    { nama: 'Fatih Arkan',      nis: '25072', kelas: '7A' },
    { nama: 'Bilal Ramadhan',   nis: '25073', kelas: '7A' },
    { nama: 'Darisah Ali',      nis: '25074', kelas: '7A' },
    { nama: 'Hafidh Nur',       nis: '25075', kelas: '7B' },
    { nama: 'Aisyah Mumairoh',  nis: '25076', kelas: '7B' },
    { nama: 'Zainab Kartika',   nis: '25077', kelas: '7B' },
    { nama: 'Umar Syahid',      nis: '25078', kelas: '8A' },
    { nama: 'Maryam Salsabila', nis: '25079', kelas: '8A' },
    { nama: 'Ibrahim Hakim',    nis: '25080', kelas: '8A' },
    { nama: 'Khadijah Putri',   nis: '25081', kelas: '8B' },
    { nama: 'Yusuf Baharuddin', nis: '25082', kelas: '8B' },
    { nama: 'Nur Hikmah',       nis: '25083', kelas: '9A' },
    { nama: 'Abdullah Azzam',   nis: '25084', kelas: '9A' },
    { nama: 'Fatimah Zahra',    nis: '25085', kelas: '9A' },
    { nama: 'Hasan Bashri',     nis: '25086', kelas: '9B' },
    { nama: 'Ruqayyah Nisa',    nis: '25087', kelas: '9B' },
    { nama: 'Khalid Wahab',     nis: '25088', kelas: '9B' },
    { nama: 'Sumayyah Dewi',    nis: '25089', kelas: '9A' },
    { nama: 'Ammar Zubair',     nis: '25090', kelas: '7A' },
  ]

  const ortuNames = [
    'Bapak Fauzan', 'Bapak Arkan', 'Bapak Ramadhan', 'Bapak Ali', 'Bapak Nur',
    'Bapak Mumair', 'Bapak Kartika', 'Bapak Syahid', 'Bapak Salsa', 'Bapak Hakim',
    'Bapak Putri', 'Bapak Bahar', 'Bapak Hikmah', 'Bapak Azzam', 'Bapak Zahra',
    'Bapak Bashri', 'Bapak Nisa', 'Bapak Wahab', 'Bapak Dewi', 'Bapak Zubair',
  ]

  const createdSiswa: { id: string; kelas: string; nama: string; nis: string }[] = []
  
  // Create special ortu for Ahmad Fauzan (demo account)
  const demoOrtuUser = await prisma.user.create({
    data: {
      email: 'ortu.ahmad@globalinsani.sch.id',
      password: await bcrypt.hash('ortu123', 10),
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
      // Ahmad Fauzan uses demo ortu
      ortuId = demoOrtu.id
    } else {
      const ortuUser = await prisma.user.create({
        data: {
          email: `ortu${i + 1}@globalinsani.sch.id`,
          password: await bcrypt.hash('ortu123', 10),
          name: ortuNames[i],
          role: 'ORTU',
        },
      })
      const ortu = await prisma.ortu.create({ data: { userId: ortuUser.id } })
      ortuId = ortu.id
    }

    const siswa = await prisma.siswa.create({
      data: { nis: s.nis, nama: s.nama, kelas: s.kelas, ortuId },
    })
    createdSiswa.push({ id: siswa.id, kelas: siswa.kelas, nama: siswa.nama, nis: siswa.nis })
  }

  // ====== SETORAN SAMPLE ======
  const getGuru = (kelas: string) =>
    ['7A', '7B', '8A'].includes(kelas) ? guru1 : guru2

  for (const siswa of createdSiswa) {
    const guru = getGuru(siswa.kelas)
    const numSetorans = rnd(2, 8)

    for (let j = 0; j < numSetorans; j++) {
      const surahIndex = j % JUZ30_SURAHS.length
      const surah = JUZ30_SURAHS[surahIndex]
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
          guruId: guru.id,
          jenis: 'TAHFIDZ',
          surah,
          ayatMulai: 1,
          ayatAkhir: rnd(5, 40),
          halMulai: 582 + surahIndex,
          halAkhir: 582 + surahIndex + 1,
          isTasmi: false,
          nilaiKomponen: JSON.stringify({ kelancaran, tajwid, makhorijulHuruf: makhorij }),
          nilaiAkhir: nilaiTahfidz,
          predikat: getPredikat(nilaiTahfidz),
          catatan: nilaiTahfidz >= 90 ? 'Lancar, tajwid bagus' : nilaiTahfidz >= 80 ? 'Sudah cukup baik' : 'Perlu latihan lagi',
          tanggal,
        },
      })

      // Tahsin (setiap 2 setoran sekali)
      if (j % 2 === 0) {
        const mkh = rnd(70, 100)
        const sfh = rnd(70, 100)
        const mad = rnd(70, 100)
        const wqf = rnd(70, 100)
        const nilaiTahsin = Math.round((mkh + sfh + mad + wqf) / 4)

        await prisma.setoran.create({
          data: {
            siswaId: siswa.id,
            guruId: guru.id,
            jenis: 'TAHSIN',
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
  console.log('👨‍🏫 Guru 1: ustadzah.aisyah@globalinsani.sch.id / guru123  (Kelas 7A, 7B, 8A)')
  console.log('👨‍🏫 Guru 2: ustad.fauzi@globalinsani.sch.id / guru123       (Kelas 8B, 9A, 9B)')
  console.log('👪 Ortu:   ortu.ahmad@globalinsani.sch.id / ortu123  (Ortu Ahmad Fauzan, 7A)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
