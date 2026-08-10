# LAPORAN PERTANGGUNGJAWABAN & PROGRESS PENGEMBANGAN APLIKASI MUTQIN

**Tanggal Laporan:** 10 Agustus 2026  
**Status Proyek:** Tahap Trial & Refinement Akhir  

---

## 1. Ringkasan Eksekutif

Pengembangan fitur utama sistem manajemen tahfidz dan tahsin (MUTQIN) telah selesai sesuai dengan spesifikasi dan kebutuhan utama sekolah. Saat ini, aplikasi telah memasuki tahap **Trial & Refinement Akhir**, di mana aplikasi sudah dapat dioperasikan secara penuh oleh Admin dan Guru di lapangan.

Fokus proyek ini adalah mendigitalisasi proses rekapitulasi setoran hafalan siswa agar terhindar dari hilangnya data fisik, mempermudah pembuatan rapor, serta memberikan kemudahan bagi Guru untuk mencatat nilai meski berada di area pesantren yang minim sinyal internet (*Offline-First Technology*).

## 2. Latar Belakang & Tujuan MUTQIN

- **Efisiensi Administratif:** Menghilangkan proses rekapitulasi nilai manual di akhir semester yang seringkali memakan waktu berminggu-minggu.
- **Transparansi:** Orang tua dan pihak sekolah dapat memantau perkembangan hafalan siswa secara berkala dan akurat.
- **Aksesibilitas Tinggi:** Menciptakan aplikasi yang ringan, bisa diakses dari *smartphone* Guru layaknya aplikasi biasa (PWA), dan tahan terhadap gangguan koneksi internet.

## 3. Timeline / Tahapan Pengembangan

Pengembangan MUTQIN telah melewati fase-fase kritikal berikut:

1. **Fase Fondasi & Database:** Perancangan struktur data awal, hierarki pengguna (Admin, Guru, Ortu, Siswa), dan pengaturan arsitektur sistem.
2. **Fase Akademik & Manajemen:** Pembuatan Dasbor Admin, pengelolaan Tahun Ajaran, Kelas, penunjukan Guru Halaqah, serta fitur *Import* massal siswa dari Excel.
3. **Fase Mesin Tahfidz & Setoran:** Pembuatan logika penilaian otomatis, pelacakan progres surat dan ayat, hingga formulir input nilai Tahfidz dan Tahsin.
4. **Fase Pelaporan & Rapor:** Sistem rekap otomatis (PDF & Excel) untuk rapor perorangan maupun massal.
5. **Fase Ketahanan Luring (Offline/PWA):** Penyempurnaan aplikasi Guru agar dapat tetap dipakai mencatat nilai meskipun kuota habis atau WiFi terputus.

## 4. Modul dan Fitur yang Telah Dikembangkan

Berdasarkan verifikasi sistem saat ini, seluruh pengerjaan modul telah berjalan dengan rincian status sebagai berikut:

| Modul | Status | Keterangan |
|-------|--------|------------|
| Manajemen Akademik (Tahun Ajaran, Kelas) | Selesai | Dapat dikelola langsung oleh Admin |
| Manajemen Guru Halaqah | Selesai | Terintegrasi dengan daftar kelas dan siswa |
| Pendaftaran Siswa (Manual & Excel Import) | Selesai | Mendukung *update* data (Upsert) massal otomatis |
| Cetak Rapor (Individu & Massal PDF) | Selesai | Menghasilkan rapor siap cetak sesuai standar sekolah |
| Backup Database (Excel & CSV) | Selesai | Menjaga keamanan data sewaktu-waktu |
| Dashboard Admin & Monitor Aktivitas | Selesai | Admin dapat melihat kapan terakhir kali guru *online* |
| Dashboard Guru & Riwayat Setoran | Selesai | Memudahkan Guru melacak siapa yang belum setor |
| Input Setoran Tahfidz & Tahsin | Selesai | Mendukung detail ayat, surah, predikat, dan buku tahsin |
| Dashboard Orang Tua | Selesai | Pemantauan progres hafalan anak dari rumah |
| Mode Luring (Offline PWA) untuk Guru | Trial / Refinement | Sinkronisasi data saat tidak ada sinyal beroperasi dengan baik, sedang dalam penyempurnaan kestabilan UX. |

## 5. Alur Penggunaan Admin

Admin bertindak sebagai pusat komando data sekolah:
1. **Setup Awal:** Admin membuat Tahun Ajaran dan Semester yang aktif.
2. **Pembagian Tugas:** Admin membuat daftar Kelas, lalu menugaskan Guru Halaqah ke kelas-kelas tersebut.
3. **Impor Siswa:** Admin mengunggah file Excel berisi data siswa baru. Sistem akan otomatis membagikan siswa ke kelas dan membuatkan akun untuk Orang Tua.
4. **Monitoring:** Admin memantau arus setoran harian di dasbor dan mencetak rekap nilai secara massal saat masa pembagian rapor tiba.

## 6. Alur Penggunaan Guru

Aplikasi Guru dirancang seefisien mungkin agar tidak mengganggu fokus mengajar:
1. Guru *Login* melalui HP, melihat daftar siswa di halaqahnya.
2. Guru menekan nama siswa yang maju menyetor.
3. Guru memasukkan rincian hafalan (Tahfidz/Tahsin) dan menekan "Simpan".
4. Jika tidak ada sinyal internet, setoran akan tersimpan sementara di HP (antrean luring).
5. Begitu HP mendapat sinyal internet, seluruh antrean nilai akan dikirim ke server secara otomatis tanpa membebani Guru.

## 7. Fitur Tahfidz & Tahsin

Sistem membedakan pencatatan Tahfidz dan Tahsin:
- **Tahfidz:** Melacak hafalan berdasarkan Nama Surah, rentang Ayat (Awal-Akhir), status *Tasmi'*, dan Predikat (Mumtaz, Jayyid, dll).
- **Tahsin:** Melacak kemajuan bacaan menggunakan rujukan nama Buku Tahsin dan rentang Halaman.
Kedua fitur ini sudah dilengkapi dengan nilai angka otomatis berdasarkan predikat untuk keperluan rapor.

## 8. Progress & Monitoring

- Progres siswa dihitung secara sistematis dari kumpulan surah Tahfidz yang telah diselesaikan.
- Admin dilengkapi tab **Monitor**, di mana Admin dapat melacak jejak digital (waktu aktivitas terakhir) dari seluruh Guru untuk memastikan kedisiplinan penggunaan aplikasi.

## 9. Reporting, Rapor & Backup

Tidak ada lagi rekap manual. Di akhir semester:
- Sistem mengalkulasi total setoran dan rata-rata nilai setiap anak.
- Admin dapat men- *download* seluruh nilai sekolah ke dalam file Excel.
- Rapor resmi PDF dapat dicetak per siswa, atau dicetak massal seluruh sekolah hanya dalam satu klik (sistem akan menggabungkannya ke dalam format siap *print*).
- Admin juga dapat mengunduh (*Backup*) seluruh *database* dalam format `.zip` kapan saja.

## 10. Hasil Trial

Aplikasi MUTQIN telah melalui tahap uji coba (*Trial*) nyata oleh perwakilan Admin dan Guru. Hal ini sangat berguna untuk mematangkan kesiapan aplikasi di lingkungan pesantren yang memiliki karakteristik jaringan internet unik.

Secara keseluruhan, fitur inti berjalan sempurna dan data tersimpan dengan valid.

## 11. Masukan Pengguna dan Penyempurnaan

Dari hasil *Trial*, masukan dari pengguna telah diklasifikasikan dan segera diselesaikan:

### Penyempurnaan UX (User Experience)
- *Input Slider* nilai yang sebelumnya lambat telah diganti menjadi pengisian angka manual agar lebih gesit.
- Sistem *Offline/PWA* yang semula lambat memuat saat jaringan buruk (*Lie-Fi*) telah dipercepat, memastikan antarmuka tetap instan dan tidak membuat *error browser* (Layar Dinosaurus).

### Bug / Perbaikan
- Perbaikan sinkronisasi *Cache* untuk memori luring, dan perbaikan penarikan data Guru Halaqah yang sempat kosong pada saat mode edit data Siswa.

### Enhancement / Pengembangan Lanjutan
- Penambahan fungsi pelacakan Buku Tahsin di fitur Ekspor Rapor agar Admin dapat melihat riwayat tahsin secara lebih mendalam (sudah diimplementasikan).

## 12. Status Saat Ini

Pengembangan fungsional sistem MUTQIN **telah selesai**. Seluruh alur (dari *Login*, manajemen kelas, hingga mencetak Rapor) sudah dapat beroperasi dengan lancar. Fokus saat ini murni pada pemolesan dan masa percobaan (*Trial & Refinement*) akhir untuk memastikan tidak ada hambatan teknis saat dioperasikan serentak oleh puluhan Guru.

## 13. Remaining Refinement (Penyempurnaan Tersisa)

Beberapa langkah penyempurnaan terakhir sebelum peluncuran resmi:
1. **Pembersihan Data (Data Wipe):** Menghapus seluruh data percobaan/ *dummy* dari pangkalan data sebelum mulai dipakai secara sungguhan.
2. **Branding Final:** Penyesuaian akhir logo, warna, dan beberapa elemen visual (opsional) sesuai keputusan final Yayasan/Sekolah.
3. **Evaluasi Server:** Meninjau spesifikasi *hosting* untuk memastikan kelancaran aplikasi saat puncak *traffic* tinggi (misal: saat pencetakan rapor massal).

## 14. Rekomendasi Finalisasi (Roadmap)

Untuk menuju proses serah terima aplikasi yang mulus, direkomendasikan peta jalan berikut:

**TRIAL** (Uji coba lapangan harian)  
↓  
**FINAL FEEDBACK** (Evaluasi bersama)  
↓  
**UX / BRANDING REFINEMENT** (Penyesuaian warna/logo jika ada)  
↓  
**FINAL UAT** (User Acceptance Test - validasi bahwa data sudah benar)  
↓  
**FINAL ACCEPTANCE** (Persetujuan peluncuran)  
↓  
**HANDOVER** (Serah terima sistem dan hapus data percobaan)

## 15. Nilai Proyek dan Termin Pembayaran

Rincian nilai pengembangan aplikasi MUTQIN secara keseluruhan berdasarkan kesepakatan adalah sebagai berikut:

- **Nilai Pengembangan Keseluruhan:** Rp5.000.000
- **Pembayaran DP (Telah Diterima):** Rp1.000.000
- **Pembayaran Tahap Kedua (Telah Diterima):** Rp2.000.000
- **Total Pembayaran Masuk:** Rp3.000.000
- **Sisa Pembayaran:** Rp2.000.000

## 16. Kesimpulan

Proyek aplikasi MUTQIN telah sukses direalisasikan dari sekadar konsep menjadi sebuah platform digital yang kokoh dan berorientasi *mobile*. Dengan dukungan kemampuan beroperasi secara luring (Offline-First), MUTQIN siap menjadi solusi permanen dan modern bagi sekolah dalam mengelola dan menjaga amanah hafalan Al-Qur'an para siswa.

---

## 17. Lampiran Teknis Singkat

- **Infrastruktur Utama:** Aplikasi berjalan di atas kerangka *Next.js 16 (App Router)* dan *React 19*, menjamin kecepatan dan modernitas setara aplikasi rintisan (*startup*) profesional.
- **Basis Data:** Menggunakan struktur relasional PostgreSQL yang diatur lewat *Prisma ORM*, sangat andal untuk keamanan dan keutuhan puluhan ribu data setoran.
- **Keamanan:** Autentikasi dikendalikan oleh *NextAuth.js* dengan enkripsi JWT (*JSON Web Token*) serta pembatasan rute ketat antar peran (Admin tidak bisa melihat layar Guru, Ortu tidak bisa mengubah nilai, dsb).
- **Service Worker:** Aplikasi dipersenjatai skrip penyimpan memori (PWA) yang mengatur *Network First, Cache Fallback* secara mulus, memberikan ilusi tanpa *loading* saat jaringan terputus.
