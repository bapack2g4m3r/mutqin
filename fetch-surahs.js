const fs = require('fs');

fetch('https://api.alquran.cloud/v1/surah')
  .then(res => res.json())
  .then(data => {
    const surahs = data.data.map(s => {
      let juz = 1;
      if (s.number >= 78) juz = 30;
      else if (s.number >= 67) juz = 29;
      else if (s.number >= 58) juz = 28;
      else if (s.number >= 51) juz = 27;
      else if (s.number >= 46) juz = 26;
      else if (s.number >= 41) juz = 25;
      else if (s.number >= 39) juz = 24;
      else if (s.number >= 36) juz = 23;
      else if (s.number >= 33) juz = 22;
      else if (s.number >= 29) juz = 21;
      else if (s.number >= 27) juz = 20;
      else if (s.number >= 25) juz = 19;
      else if (s.number >= 23) juz = 18;
      else if (s.number >= 21) juz = 17;
      else if (s.number >= 18) juz = 16;
      else if (s.number >= 17) juz = 15;
      else if (s.number >= 15) juz = 14;
      else if (s.number >= 12) juz = 13;
      else if (s.number >= 11) juz = 12;
      else if (s.number >= 9) juz = 11;
      else if (s.number >= 8) juz = 9;
      else if (s.number >= 6) juz = 7;
      else if (s.number >= 4) juz = 4;
      else if (s.number >= 3) juz = 3;
      else if (s.number >= 2) juz = 1;

      return {
        id: s.number,
        nama: s.englishName,
        namaArab: s.name,
        jumlahAyat: s.numberOfAyahs,
        halMulai: 1, 
        juz: juz
      }
    });

    let currentContent = fs.readFileSync('./lib/surah-data.ts', 'utf8');
    // Remove the JUZ_30_SURAHS export and replace with QURAN_SURAHS
    currentContent = currentContent.replace(/export const JUZ_30_SURAHS: Surah\[\] = \[[\s\S]*?\]/m, `// 114 Surah Lengkap\nexport const QURAN_SURAHS: Surah[] = ${JSON.stringify(surahs, null, 2)}`);
    
    // If it didn't find JUZ_30_SURAHS, it might have been already replaced partially, so we just append it if missing
    if (!currentContent.includes('QURAN_SURAHS')) {
       currentContent += `\n// 114 Surah Lengkap\nexport const QURAN_SURAHS: Surah[] = ${JSON.stringify(surahs, null, 2)}\n`;
    }

    fs.writeFileSync('./lib/surah-data.ts', currentContent);
    console.log("Successfully wrote 114 surahs to lib/surah-data.ts");
  })
  .catch(console.error);
