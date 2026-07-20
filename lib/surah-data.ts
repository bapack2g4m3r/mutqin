export interface Surah {
  id: number
  nama: string
  namaArab: string
  jumlahAyat: number
  halMulai: number
  juz: number
}

// Juz 30 (Juz Amma) - 37 Surah
// 114 Surah Lengkap
export const QURAN_SURAHS: Surah[] = [
  {
    "id": 1,
    "nama": "Al-Faatiha",
    "namaArab": "سُورَةُ ٱلْفَاتِحَةِ",
    "jumlahAyat": 7,
    "halMulai": 1,
    "juz": 1
  },
  {
    "id": 2,
    "nama": "Al-Baqara",
    "namaArab": "سُورَةُ البَقَرَةِ",
    "jumlahAyat": 286,
    "halMulai": 1,
    "juz": 1
  },
  {
    "id": 3,
    "nama": "Aal-i-Imraan",
    "namaArab": "سُورَةُ آلِ عِمۡرَانَ",
    "jumlahAyat": 200,
    "halMulai": 1,
    "juz": 3
  },
  {
    "id": 4,
    "nama": "An-Nisaa",
    "namaArab": "سُورَةُ النِّسَاءِ",
    "jumlahAyat": 176,
    "halMulai": 1,
    "juz": 4
  },
  {
    "id": 5,
    "nama": "Al-Maaida",
    "namaArab": "سُورَةُ المَائـِدَةِ",
    "jumlahAyat": 120,
    "halMulai": 1,
    "juz": 4
  },
  {
    "id": 6,
    "nama": "Al-An'aam",
    "namaArab": "سُورَةُ الأَنۡعَامِ",
    "jumlahAyat": 165,
    "halMulai": 1,
    "juz": 7
  },
  {
    "id": 7,
    "nama": "Al-A'raaf",
    "namaArab": "سُورَةُ الأَعۡرَافِ",
    "jumlahAyat": 206,
    "halMulai": 1,
    "juz": 7
  },
  {
    "id": 8,
    "nama": "Al-Anfaal",
    "namaArab": "سُورَةُ الأَنفَالِ",
    "jumlahAyat": 75,
    "halMulai": 1,
    "juz": 9
  },
  {
    "id": 9,
    "nama": "At-Tawba",
    "namaArab": "سُورَةُ التَّوۡبَةِ",
    "jumlahAyat": 129,
    "halMulai": 1,
    "juz": 11
  },
  {
    "id": 10,
    "nama": "Yunus",
    "namaArab": "سُورَةُ يُونُسَ",
    "jumlahAyat": 109,
    "halMulai": 1,
    "juz": 11
  },
  {
    "id": 11,
    "nama": "Hud",
    "namaArab": "سُورَةُ هُودٍ",
    "jumlahAyat": 123,
    "halMulai": 1,
    "juz": 12
  },
  {
    "id": 12,
    "nama": "Yusuf",
    "namaArab": "سُورَةُ يُوسُفَ",
    "jumlahAyat": 111,
    "halMulai": 1,
    "juz": 13
  },
  {
    "id": 13,
    "nama": "Ar-Ra'd",
    "namaArab": "سُورَةُ الرَّعۡدِ",
    "jumlahAyat": 43,
    "halMulai": 1,
    "juz": 13
  },
  {
    "id": 14,
    "nama": "Ibrahim",
    "namaArab": "سُورَةُ إِبۡرَاهِيمَ",
    "jumlahAyat": 52,
    "halMulai": 1,
    "juz": 13
  },
  {
    "id": 15,
    "nama": "Al-Hijr",
    "namaArab": "سُورَةُ الحِجۡرِ",
    "jumlahAyat": 99,
    "halMulai": 1,
    "juz": 14
  },
  {
    "id": 16,
    "nama": "An-Nahl",
    "namaArab": "سُورَةُ النَّحۡلِ",
    "jumlahAyat": 128,
    "halMulai": 1,
    "juz": 14
  },
  {
    "id": 17,
    "nama": "Al-Israa",
    "namaArab": "سُورَةُ الإِسۡرَاءِ",
    "jumlahAyat": 111,
    "halMulai": 1,
    "juz": 15
  },
  {
    "id": 18,
    "nama": "Al-Kahf",
    "namaArab": "سُورَةُ الكَهۡفِ",
    "jumlahAyat": 110,
    "halMulai": 1,
    "juz": 16
  },
  {
    "id": 19,
    "nama": "Maryam",
    "namaArab": "سُورَةُ مَرۡيَمَ",
    "jumlahAyat": 98,
    "halMulai": 1,
    "juz": 16
  },
  {
    "id": 20,
    "nama": "Taa-Haa",
    "namaArab": "سُورَةُ طه",
    "jumlahAyat": 135,
    "halMulai": 1,
    "juz": 16
  },
  {
    "id": 21,
    "nama": "Al-Anbiyaa",
    "namaArab": "سُورَةُ الأَنبِيَاءِ",
    "jumlahAyat": 112,
    "halMulai": 1,
    "juz": 17
  },
  {
    "id": 22,
    "nama": "Al-Hajj",
    "namaArab": "سُورَةُ الحَجِّ",
    "jumlahAyat": 78,
    "halMulai": 1,
    "juz": 17
  },
  {
    "id": 23,
    "nama": "Al-Muminoon",
    "namaArab": "سُورَةُ المُؤۡمِنُونَ",
    "jumlahAyat": 118,
    "halMulai": 1,
    "juz": 18
  },
  {
    "id": 24,
    "nama": "An-Noor",
    "namaArab": "سُورَةُ النُّورِ",
    "jumlahAyat": 64,
    "halMulai": 1,
    "juz": 18
  },
  {
    "id": 25,
    "nama": "Al-Furqaan",
    "namaArab": "سُورَةُ الفُرۡقَانِ",
    "jumlahAyat": 77,
    "halMulai": 1,
    "juz": 19
  },
  {
    "id": 26,
    "nama": "Ash-Shu'araa",
    "namaArab": "سُورَةُ الشُّعَرَاءِ",
    "jumlahAyat": 227,
    "halMulai": 1,
    "juz": 19
  },
  {
    "id": 27,
    "nama": "An-Naml",
    "namaArab": "سُورَةُ النَّمۡلِ",
    "jumlahAyat": 93,
    "halMulai": 1,
    "juz": 20
  },
  {
    "id": 28,
    "nama": "Al-Qasas",
    "namaArab": "سُورَةُ القَصَصِ",
    "jumlahAyat": 88,
    "halMulai": 1,
    "juz": 20
  },
  {
    "id": 29,
    "nama": "Al-Ankaboot",
    "namaArab": "سُورَةُ العَنكَبُوتِ",
    "jumlahAyat": 69,
    "halMulai": 1,
    "juz": 21
  },
  {
    "id": 30,
    "nama": "Ar-Room",
    "namaArab": "سُورَةُ الرُّومِ",
    "jumlahAyat": 60,
    "halMulai": 1,
    "juz": 21
  },
  {
    "id": 31,
    "nama": "Luqman",
    "namaArab": "سُورَةُ لُقۡمَانَ",
    "jumlahAyat": 34,
    "halMulai": 1,
    "juz": 21
  },
  {
    "id": 32,
    "nama": "As-Sajda",
    "namaArab": "سُورَةُ السَّجۡدَةِ",
    "jumlahAyat": 30,
    "halMulai": 1,
    "juz": 21
  },
  {
    "id": 33,
    "nama": "Al-Ahzaab",
    "namaArab": "سُورَةُ الأَحۡزَابِ",
    "jumlahAyat": 73,
    "halMulai": 1,
    "juz": 22
  },
  {
    "id": 34,
    "nama": "Saba",
    "namaArab": "سُورَةُ سَبَإٍ",
    "jumlahAyat": 54,
    "halMulai": 1,
    "juz": 22
  },
  {
    "id": 35,
    "nama": "Faatir",
    "namaArab": "سُورَةُ فَاطِرٍ",
    "jumlahAyat": 45,
    "halMulai": 1,
    "juz": 22
  },
  {
    "id": 36,
    "nama": "Yaseen",
    "namaArab": "سُورَةُ يسٓ",
    "jumlahAyat": 83,
    "halMulai": 1,
    "juz": 23
  },
  {
    "id": 37,
    "nama": "As-Saaffaat",
    "namaArab": "سُورَةُ الصَّافَّاتِ",
    "jumlahAyat": 182,
    "halMulai": 1,
    "juz": 23
  },
  {
    "id": 38,
    "nama": "Saad",
    "namaArab": "سُورَةُ صٓ",
    "jumlahAyat": 88,
    "halMulai": 1,
    "juz": 23
  },
  {
    "id": 39,
    "nama": "Az-Zumar",
    "namaArab": "سُورَةُ الزُّمَرِ",
    "jumlahAyat": 75,
    "halMulai": 1,
    "juz": 24
  },
  {
    "id": 40,
    "nama": "Ghafir",
    "namaArab": "سُورَةُ غَافِرٍ",
    "jumlahAyat": 85,
    "halMulai": 1,
    "juz": 24
  },
  {
    "id": 41,
    "nama": "Fussilat",
    "namaArab": "سُورَةُ فُصِّلَتۡ",
    "jumlahAyat": 54,
    "halMulai": 1,
    "juz": 25
  },
  {
    "id": 42,
    "nama": "Ash-Shura",
    "namaArab": "سُورَةُ الشُّورَىٰ",
    "jumlahAyat": 53,
    "halMulai": 1,
    "juz": 25
  },
  {
    "id": 43,
    "nama": "Az-Zukhruf",
    "namaArab": "سُورَةُ الزُّخۡرُفِ",
    "jumlahAyat": 89,
    "halMulai": 1,
    "juz": 25
  },
  {
    "id": 44,
    "nama": "Ad-Dukhaan",
    "namaArab": "سُورَةُ الدُّخَانِ",
    "jumlahAyat": 59,
    "halMulai": 1,
    "juz": 25
  },
  {
    "id": 45,
    "nama": "Al-Jaathiya",
    "namaArab": "سُورَةُ الجَاثِيَةِ",
    "jumlahAyat": 37,
    "halMulai": 1,
    "juz": 25
  },
  {
    "id": 46,
    "nama": "Al-Ahqaf",
    "namaArab": "سُورَةُ الأَحۡقَافِ",
    "jumlahAyat": 35,
    "halMulai": 1,
    "juz": 26
  },
  {
    "id": 47,
    "nama": "Muhammad",
    "namaArab": "سُورَةُ مُحَمَّدٍ",
    "jumlahAyat": 38,
    "halMulai": 1,
    "juz": 26
  },
  {
    "id": 48,
    "nama": "Al-Fath",
    "namaArab": "سُورَةُ الفَتۡحِ",
    "jumlahAyat": 29,
    "halMulai": 1,
    "juz": 26
  },
  {
    "id": 49,
    "nama": "Al-Hujuraat",
    "namaArab": "سُورَةُ الحُجُرَاتِ",
    "jumlahAyat": 18,
    "halMulai": 1,
    "juz": 26
  },
  {
    "id": 50,
    "nama": "Qaaf",
    "namaArab": "سُورَةُ قٓ",
    "jumlahAyat": 45,
    "halMulai": 1,
    "juz": 26
  },
  {
    "id": 51,
    "nama": "Adh-Dhaariyat",
    "namaArab": "سُورَةُ الذَّارِيَاتِ",
    "jumlahAyat": 60,
    "halMulai": 1,
    "juz": 27
  },
  {
    "id": 52,
    "nama": "At-Tur",
    "namaArab": "سُورَةُ الطُّورِ",
    "jumlahAyat": 49,
    "halMulai": 1,
    "juz": 27
  },
  {
    "id": 53,
    "nama": "An-Najm",
    "namaArab": "سُورَةُ النَّجۡمِ",
    "jumlahAyat": 62,
    "halMulai": 1,
    "juz": 27
  },
  {
    "id": 54,
    "nama": "Al-Qamar",
    "namaArab": "سُورَةُ القَمَرِ",
    "jumlahAyat": 55,
    "halMulai": 1,
    "juz": 27
  },
  {
    "id": 55,
    "nama": "Ar-Rahmaan",
    "namaArab": "سُورَةُ الرَّحۡمَٰن",
    "jumlahAyat": 78,
    "halMulai": 1,
    "juz": 27
  },
  {
    "id": 56,
    "nama": "Al-Waaqia",
    "namaArab": "سُورَةُ الوَاقِعَةِ",
    "jumlahAyat": 96,
    "halMulai": 1,
    "juz": 27
  },
  {
    "id": 57,
    "nama": "Al-Hadid",
    "namaArab": "سُورَةُ الحَدِيدِ",
    "jumlahAyat": 29,
    "halMulai": 1,
    "juz": 27
  },
  {
    "id": 58,
    "nama": "Al-Mujaadila",
    "namaArab": "سُورَةُ المُجَادلَةِ",
    "jumlahAyat": 22,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 59,
    "nama": "Al-Hashr",
    "namaArab": "سُورَةُ الحَشۡرِ",
    "jumlahAyat": 24,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 60,
    "nama": "Al-Mumtahana",
    "namaArab": "سُورَةُ المُمۡتَحنَةِ",
    "jumlahAyat": 13,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 61,
    "nama": "As-Saff",
    "namaArab": "سُورَةُ الصَّفِّ",
    "jumlahAyat": 14,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 62,
    "nama": "Al-Jumu'a",
    "namaArab": "سُورَةُ الجُمُعَةِ",
    "jumlahAyat": 11,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 63,
    "nama": "Al-Munaafiqoon",
    "namaArab": "سُورَةُ المُنَافِقُونَ",
    "jumlahAyat": 11,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 64,
    "nama": "At-Taghaabun",
    "namaArab": "سُورَةُ التَّغَابُنِ",
    "jumlahAyat": 18,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 65,
    "nama": "At-Talaaq",
    "namaArab": "سُورَةُ الطَّلَاقِ",
    "jumlahAyat": 12,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 66,
    "nama": "At-Tahrim",
    "namaArab": "سُورَةُ التَّحۡرِيمِ",
    "jumlahAyat": 12,
    "halMulai": 1,
    "juz": 28
  },
  {
    "id": 67,
    "nama": "Al-Mulk",
    "namaArab": "سُورَةُ المُلۡكِ",
    "jumlahAyat": 30,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 68,
    "nama": "Al-Qalam",
    "namaArab": "سُورَةُ القَلَمِ",
    "jumlahAyat": 52,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 69,
    "nama": "Al-Haaqqa",
    "namaArab": "سُورَةُ الحَاقَّةِ",
    "jumlahAyat": 52,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 70,
    "nama": "Al-Ma'aarij",
    "namaArab": "سُورَةُ المَعَارِجِ",
    "jumlahAyat": 44,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 71,
    "nama": "Nooh",
    "namaArab": "سُورَةُ نُوحٍ",
    "jumlahAyat": 28,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 72,
    "nama": "Al-Jinn",
    "namaArab": "سُورَةُ الجِنِّ",
    "jumlahAyat": 28,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 73,
    "nama": "Al-Muzzammil",
    "namaArab": "سُورَةُ المُزَّمِّلِ",
    "jumlahAyat": 20,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 74,
    "nama": "Al-Muddaththir",
    "namaArab": "سُورَةُ المُدَّثِّرِ",
    "jumlahAyat": 56,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 75,
    "nama": "Al-Qiyaama",
    "namaArab": "سُورَةُ القِيَامَةِ",
    "jumlahAyat": 40,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 76,
    "nama": "Al-Insaan",
    "namaArab": "سُورَةُ الإِنسَانِ",
    "jumlahAyat": 31,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 77,
    "nama": "Al-Mursalaat",
    "namaArab": "سُورَةُ المُرۡسَلَاتِ",
    "jumlahAyat": 50,
    "halMulai": 1,
    "juz": 29
  },
  {
    "id": 78,
    "nama": "An-Naba",
    "namaArab": "سُورَةُ النَّبَإِ",
    "jumlahAyat": 40,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 79,
    "nama": "An-Naazi'aat",
    "namaArab": "سُورَةُ النَّازِعَاتِ",
    "jumlahAyat": 46,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 80,
    "nama": "Abasa",
    "namaArab": "سُورَةُ عَبَسَ",
    "jumlahAyat": 42,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 81,
    "nama": "At-Takwir",
    "namaArab": "سُورَةُ التَّكۡوِيرِ",
    "jumlahAyat": 29,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 82,
    "nama": "Al-Infitaar",
    "namaArab": "سُورَةُ الانفِطَارِ",
    "jumlahAyat": 19,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 83,
    "nama": "Al-Mutaffifin",
    "namaArab": "سُورَةُ المُطَفِّفِينَ",
    "jumlahAyat": 36,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 84,
    "nama": "Al-Inshiqaaq",
    "namaArab": "سُورَةُ الانشِقَاقِ",
    "jumlahAyat": 25,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 85,
    "nama": "Al-Burooj",
    "namaArab": "سُورَةُ البُرُوجِ",
    "jumlahAyat": 22,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 86,
    "nama": "At-Taariq",
    "namaArab": "سُورَةُ الطَّارِقِ",
    "jumlahAyat": 17,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 87,
    "nama": "Al-A'laa",
    "namaArab": "سُورَةُ الأَعۡلَىٰ",
    "jumlahAyat": 19,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 88,
    "nama": "Al-Ghaashiya",
    "namaArab": "سُورَةُ الغَاشِيَةِ",
    "jumlahAyat": 26,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 89,
    "nama": "Al-Fajr",
    "namaArab": "سُورَةُ الفَجۡرِ",
    "jumlahAyat": 30,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 90,
    "nama": "Al-Balad",
    "namaArab": "سُورَةُ البَلَدِ",
    "jumlahAyat": 20,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 91,
    "nama": "Ash-Shams",
    "namaArab": "سُورَةُ الشَّمۡسِ",
    "jumlahAyat": 15,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 92,
    "nama": "Al-Lail",
    "namaArab": "سُورَةُ اللَّيۡلِ",
    "jumlahAyat": 21,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 93,
    "nama": "Ad-Dhuhaa",
    "namaArab": "سُورَةُ الضُّحَىٰ",
    "jumlahAyat": 11,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 94,
    "nama": "Ash-Sharh",
    "namaArab": "سُورَةُ الشَّرۡحِ",
    "jumlahAyat": 8,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 95,
    "nama": "At-Tin",
    "namaArab": "سُورَةُ التِّينِ",
    "jumlahAyat": 8,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 96,
    "nama": "Al-Alaq",
    "namaArab": "سُورَةُ العَلَقِ",
    "jumlahAyat": 19,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 97,
    "nama": "Al-Qadr",
    "namaArab": "سُورَةُ القَدۡرِ",
    "jumlahAyat": 5,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 98,
    "nama": "Al-Bayyina",
    "namaArab": "سُورَةُ البَيِّنَةِ",
    "jumlahAyat": 8,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 99,
    "nama": "Az-Zalzala",
    "namaArab": "سُورَةُ الزَّلۡزَلَةِ",
    "jumlahAyat": 8,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 100,
    "nama": "Al-Aadiyaat",
    "namaArab": "سُورَةُ العَادِيَاتِ",
    "jumlahAyat": 11,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 101,
    "nama": "Al-Qaari'a",
    "namaArab": "سُورَةُ القَارِعَةِ",
    "jumlahAyat": 11,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 102,
    "nama": "At-Takaathur",
    "namaArab": "سُورَةُ التَّكَاثُرِ",
    "jumlahAyat": 8,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 103,
    "nama": "Al-Asr",
    "namaArab": "سُورَةُ العَصۡرِ",
    "jumlahAyat": 3,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 104,
    "nama": "Al-Humaza",
    "namaArab": "سُورَةُ الهُمَزَةِ",
    "jumlahAyat": 9,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 105,
    "nama": "Al-Fil",
    "namaArab": "سُورَةُ الفِيلِ",
    "jumlahAyat": 5,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 106,
    "nama": "Quraish",
    "namaArab": "سُورَةُ قُرَيۡشٍ",
    "jumlahAyat": 4,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 107,
    "nama": "Al-Maa'un",
    "namaArab": "سُورَةُ المَاعُونِ",
    "jumlahAyat": 7,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 108,
    "nama": "Al-Kawthar",
    "namaArab": "سُورَةُ الكَوۡثَرِ",
    "jumlahAyat": 3,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 109,
    "nama": "Al-Kaafiroon",
    "namaArab": "سُورَةُ الكَافِرُونَ",
    "jumlahAyat": 6,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 110,
    "nama": "An-Nasr",
    "namaArab": "سُورَةُ النَّصۡرِ",
    "jumlahAyat": 3,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 111,
    "nama": "Al-Masad",
    "namaArab": "سُورَةُ المَسَدِ",
    "jumlahAyat": 5,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 112,
    "nama": "Al-Ikhlaas",
    "namaArab": "سُورَةُ الإِخۡلَاصِ",
    "jumlahAyat": 4,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 113,
    "nama": "Al-Falaq",
    "namaArab": "سُورَةُ الفَلَقِ",
    "jumlahAyat": 5,
    "halMulai": 1,
    "juz": 30
  },
  {
    "id": 114,
    "nama": "An-Naas",
    "namaArab": "سُورَةُ النَّاسِ",
    "jumlahAyat": 6,
    "halMulai": 1,
    "juz": 30
  }
]

export const TOTAL_SURAH_JUZ30 = QURAN_SURAHS.length // 114

export function getSurahById(id: number): Surah | undefined {
  return QURAN_SURAHS.find(s => s.id === id)
}

export function getSurahByNama(nama: string): Surah | undefined {
  return QURAN_SURAHS.find(s => s.nama === nama)
}

export function calcProgress(selesaiSurah: string[]): number {
  const unique = new Set(selesaiSurah)
  const allNames = QURAN_SURAHS.map(s => s.nama)
  const selesai = [...unique].filter(n => allNames.includes(n)).length
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
