export interface Surah {
  id: number
  nama: string
  namaArab: string
  jumlahAyat: number
  halMulai: number
  juz: number
}

// Juz 30 (Juz Amma) - 37 Surah
export const JUZ_30_SURAHS: Surah[] = [
  { id: 78,  nama: "An-Naba'",      namaArab: "النبأ",       jumlahAyat: 40, halMulai: 582, juz: 30 },
  { id: 79,  nama: "An-Nazi'at",    namaArab: "النازعات",    jumlahAyat: 46, halMulai: 583, juz: 30 },
  { id: 80,  nama: "'Abasa",        namaArab: "عبس",         jumlahAyat: 42, halMulai: 585, juz: 30 },
  { id: 81,  nama: "At-Takwir",     namaArab: "التكوير",     jumlahAyat: 29, halMulai: 586, juz: 30 },
  { id: 82,  nama: "Al-Infithar",   namaArab: "الانفطار",    jumlahAyat: 19, halMulai: 587, juz: 30 },
  { id: 83,  nama: "Al-Muthaffifin",namaArab: "المطففين",    jumlahAyat: 36, halMulai: 587, juz: 30 },
  { id: 84,  nama: "Al-Insyiqaq",   namaArab: "الانشقاق",    jumlahAyat: 25, halMulai: 589, juz: 30 },
  { id: 85,  nama: "Al-Buruj",      namaArab: "البروج",      jumlahAyat: 22, halMulai: 590, juz: 30 },
  { id: 86,  nama: "At-Thariq",     namaArab: "الطارق",      jumlahAyat: 17, halMulai: 591, juz: 30 },
  { id: 87,  nama: "Al-A'la",       namaArab: "الأعلى",      jumlahAyat: 19, halMulai: 591, juz: 30 },
  { id: 88,  nama: "Al-Ghasyiyah",  namaArab: "الغاشية",     jumlahAyat: 26, halMulai: 592, juz: 30 },
  { id: 89,  nama: "Al-Fajr",       namaArab: "الفجر",       jumlahAyat: 30, halMulai: 593, juz: 30 },
  { id: 90,  nama: "Al-Balad",      namaArab: "البلد",       jumlahAyat: 20, halMulai: 594, juz: 30 },
  { id: 91,  nama: "Asy-Syams",     namaArab: "الشمس",       jumlahAyat: 15, halMulai: 595, juz: 30 },
  { id: 92,  nama: "Al-Lail",       namaArab: "الليل",       jumlahAyat: 21, halMulai: 595, juz: 30 },
  { id: 93,  nama: "Adh-Dhuha",     namaArab: "الضحى",       jumlahAyat: 11, halMulai: 596, juz: 30 },
  { id: 94,  nama: "Al-Insyirah",   namaArab: "الشرح",       jumlahAyat: 8,  halMulai: 596, juz: 30 },
  { id: 95,  nama: "At-Tin",        namaArab: "التين",       jumlahAyat: 8,  halMulai: 597, juz: 30 },
  { id: 96,  nama: "Al-'Alaq",      namaArab: "العلق",       jumlahAyat: 19, halMulai: 597, juz: 30 },
  { id: 97,  nama: "Al-Qadr",       namaArab: "القدر",       jumlahAyat: 5,  halMulai: 598, juz: 30 },
  { id: 98,  nama: "Al-Bayyinah",   namaArab: "البينة",      jumlahAyat: 8,  halMulai: 598, juz: 30 },
  { id: 99,  nama: "Az-Zalzalah",   namaArab: "الزلزلة",     jumlahAyat: 8,  halMulai: 599, juz: 30 },
  { id: 100, nama: "Al-'Adiyat",    namaArab: "العاديات",    jumlahAyat: 11, halMulai: 599, juz: 30 },
  { id: 101, nama: "Al-Qari'ah",    namaArab: "القارعة",     jumlahAyat: 11, halMulai: 600, juz: 30 },
  { id: 102, nama: "At-Takatsur",   namaArab: "التكاثر",     jumlahAyat: 8,  halMulai: 600, juz: 30 },
  { id: 103, nama: "Al-'Ashr",      namaArab: "العصر",       jumlahAyat: 3,  halMulai: 601, juz: 30 },
  { id: 104, nama: "Al-Humazah",    namaArab: "الهمزة",      jumlahAyat: 9,  halMulai: 601, juz: 30 },
  { id: 105, nama: "Al-Fil",        namaArab: "الفيل",       jumlahAyat: 5,  halMulai: 601, juz: 30 },
  { id: 106, nama: "Quraisy",       namaArab: "قريش",        jumlahAyat: 4,  halMulai: 602, juz: 30 },
  { id: 107, nama: "Al-Ma'un",      namaArab: "الماعون",     jumlahAyat: 7,  halMulai: 602, juz: 30 },
  { id: 108, nama: "Al-Kautsar",    namaArab: "الكوثر",      jumlahAyat: 3,  halMulai: 602, juz: 30 },
  { id: 109, nama: "Al-Kafirun",    namaArab: "الكافرون",    jumlahAyat: 6,  halMulai: 603, juz: 30 },
  { id: 110, nama: "An-Nashr",      namaArab: "النصر",       jumlahAyat: 3,  halMulai: 603, juz: 30 },
  { id: 111, nama: "Al-Masad",      namaArab: "المسد",       jumlahAyat: 5,  halMulai: 603, juz: 30 },
  { id: 112, nama: "Al-Ikhlas",     namaArab: "الإخلاص",     jumlahAyat: 4,  halMulai: 604, juz: 30 },
  { id: 113, nama: "Al-Falaq",      namaArab: "الفلق",       jumlahAyat: 5,  halMulai: 604, juz: 30 },
  { id: 114, nama: "An-Naas",       namaArab: "الناس",       jumlahAyat: 6,  halMulai: 604, juz: 30 },
]

export const TOTAL_SURAH_JUZ30 = JUZ_30_SURAHS.length // 37

export function getSurahById(id: number): Surah | undefined {
  return JUZ_30_SURAHS.find(s => s.id === id)
}

export function getSurahByNama(nama: string): Surah | undefined {
  return JUZ_30_SURAHS.find(s => s.nama === nama)
}

export function calcProgress(selesaiSurah: string[]): number {
  const unique = new Set(selesaiSurah)
  const juz30Names = JUZ_30_SURAHS.map(s => s.nama)
  const selesai = [...unique].filter(n => juz30Names.includes(n)).length
  return Math.round((selesai / TOTAL_SURAH_JUZ30) * 100)
}

export function getPredikat(nilai: number): { kode: string; label: string; grade: string } {
  if (nilai >= 90) return { kode: 'MUMTAZ',      label: 'Mumtaz',       grade: 'A' }
  if (nilai >= 80) return { kode: 'JAYYID_JIDDAN', label: 'Jayyid Jiddan', grade: 'B' }
  if (nilai >= 70) return { kode: 'JAYYID',       label: 'Jayyid',        grade: 'C' }
  return              { kode: 'GHAIR_MAQBUL',  label: 'Ghair Maqbul',  grade: 'K' }
}

export function calcNilaiTahfidz(komponen: {
  kelancaran: number
  tajwid: number
  makhorijulHuruf: number
}): number {
  return Math.round(
    komponen.kelancaran * 0.4 +
    komponen.tajwid * 0.4 +
    komponen.makhorijulHuruf * 0.2
  )
}

export function calcNilaiTahsin(komponen: {
  makhorijulHuruf: number
  sifatulHuruf: number
  ahkamulMad: number
  ahkamulWaqaf: number
}): number {
  return Math.round(
    (komponen.makhorijulHuruf +
     komponen.sifatulHuruf +
     komponen.ahkamulMad +
     komponen.ahkamulWaqaf) / 4
  )
}
