# TECHNICAL APPENDIX: MUTQIN ARCHITECTURE & IMPLEMENTATION

**Date:** 10 August 2026  
**Stack:** Next.js 16 (App Router), React 19, Prisma ORM, PostgreSQL (via Supabase/Neon), NextAuth.js v4.

---

## 1. System Architecture

Aplikasi MUTQIN dibangun di atas arsitektur *monolith* modern menggunakan kerangka kerja **Next.js App Router**. Seluruh kode (Frontend dan Backend API) berada di dalam satu repositori.

### Frontend
- Komponen menggunakan React 19.
- *Styling* menggunakan CSS Vanilla murni tanpa Tailwind (sesuai *design system* custom `globals.css`).
- *State Management* dan pengambilan data klien (*client fetching*) menggunakan standar `fetch` API dipadu dengan `useState` dan `useEffect`.
- Progressive Web App (PWA) dikelola menggunakan file `public/sw.js` (Service Worker) dan `OfflineReadyManager.tsx` (sebagai jembatan antara antarmuka dan memori lokal).

### Backend & Database
- Prisma ORM digunakan untuk berinteraksi dengan database PostgreSQL.
- API *routes* diletakkan pada folder `app/api/...` menggunakan arsitektur RESTful murni yang mengembalikan JSON.
- **Authentication** diatur oleh `NextAuth.js` berbasis kredensial (JWT).

---

## 2. PWA & Offline Support Implementation

Fokus terbesar teknis aplikasi ini adalah ketahanannya di mode luring (PWA).

### Offline Storage (Cache & LocalStorage)
- **Service Worker (`sw.js`):** Meng-intercept rute `/guru/*` dan `/api/*`. Menggunakan strategi:
  - *Network First, Cache Fallback* (dengan Timeout 3 detik untuk Navigasi HTML/RSC dan 15 detik untuk API berat).
  - Khusus `/api/auth/session` dicegat dan dicache agar NextAuth tidak me-logout pengguna saat koneksi *Lie-Fi* (jaringan terputus mendadak saat reconnect).
- **LocalStorage:** Menyimpan data *offline queue* (antrean setoran), data siswa (maks 500 siswa per guru), dan statistik *dashboard*.

### Synchronization Flow (`OfflineReadyManager`)
1. Guru menekan "Perbarui Data".
2. Aplikasi menarik data dari `/api/siswa?limit=500` dan `/api/guru/dashboard`.
3. Service Worker secara pasif menyimpan respons `200 OK` ke dalam `CacheStorage`.
4. Jika *offline*, Service Worker memutus *request* dalam hitungan detik dan menyajikan data dari *cache*.
5. Guru melakukan input setoran -> tersimpan di `LocalStorage` sebagai *Queue*.
6. *Event Listener* `window.addEventListener('online')` atau intervensi manual memicu `handleSyncNow()`, yang mengirimkan semua antrean POST `/api/setoran` ke server menggunakan `Promise.allSettled`.

---

## 3. Database Schema & Relationships

### Core Entities:
- **TahunAjaran & Semester:** Manajemen periode aktif.
- **Kelas:** Mengelompokkan Siswa. Setiap kelas terhubung ke satu *TahunAjaran*.
- **Halaqah:** Model pengganti *Wali Kelas*. Setiap Halaqah terkait dengan 1 Kelas dan 1 Guru, menaungi N Siswa.
- **User (Role: ADMIN, GURU, ORTU):** Sentral kredensial login. Tabel `Guru` dan `Ortu` memiliki referensi langsung (`userId`) ke tabel ini.
- **Siswa:** Data santri, menyimpan relasi ke `Ortu`, `Kelas`, dan `Halaqah`.
- **Setoran:** Menyimpan log progres tahfidz/tahsin. Mengandung atribut `nilaiAkhir`, `predikat`, `surah`, `ayatMulai`, `ayatAkhir`, dll.

### Notable Business Rules:
- **Relasi Guru Halaqah:** Saat filter *Dashboard* atau *Siswa* (Role: GURU), API mendeteksi `guru.halaqahs`. Jika Guru terdaftar di Halaqah, API secara otomatis hanya mengembalikan siswa yang terkait dengan halaqaah-halaqah tersebut (Row-Level Authorization at Application Level).
- **Soft Deletes / Cascade:** Prisma diatur menggunakan `onDelete: Cascade` untuk beberapa tabel utama, namun data setoran tetap utuh (bisa direkapitulasi per Semester).

---

## 4. API Routes & Server Functions

- `/api/auth/[...nextauth]`: Menyediakan *endpoint* Login dan Sesi. Password di-*hash* menggunakan `bcryptjs`.
- `/api/akademik`: Menyediakan agregasi hierarki lengkap `TahunAjaran > Kelas > Halaqah`.
- `/api/siswa` & `/api/siswa/[id]`: CRUD data siswa dengan *pagination* dan filter tingkat lanjut berbasis peran (*Role-Based*).
- `/api/siswa/bulk`: Modul spesifik untuk *Upsert* data ribuan siswa via CSV/Excel yang dioptimalkan secara paralel.
- `/api/setoran`: Endpoint utama transaksi nilai. Termasuk validasi jenis setoran (Tahfidz/Tahsin).
- `/api/backup/export`: Ekspor basis data dinamis ke dalam format Zip berisi file Excel dan CSV (menggunakan pustaka `xlsx` dan `jszip`).

---

## 5. Security & Authorization Notes

1. **Role-Based Access Control (RBAC):**
   Di setiap *layout* halaman (`app/admin/layout.tsx`, `app/guru/layout.tsx`), terdapat *guard* yang mengecek `session.user.role`. Apabila diakses *Role* yang salah, pengguna dipaksa (*redirect*) keluar.
2. **API Protection:**
   Setiap berkas `/api/...` diawali dengan `getServerSession(authOptions)`. Endpoint mengembalikan `401 Unauthorized` jika diakses tanpa JWT yang valid.
3. **Data Isolation:**
   Guru hanya bisa mengambil data dari Endpoint Siswa berdasarkan *Scope* Halaqah miliknya, hal ini dijamin langsung pada parameter `where` di Prisma (`app/api/siswa/route.ts`).

---

## 6. Known Technical Debt / Edge Cases

- **Session Expiration Offline:** Jika JWT Token benar-benar kedaluwarsa saat Guru sedang *offline* berhari-hari, saat koneksi pulih, NextAuth mungkin akan mendeteksi `401` sebelum antrean setoran (`queue`) berhasil dikirim. Disarankan antrean tidak boleh dipendam lebih dari durasi maksimal *Token* (30 hari).
- **Pagination Admin:** Saat ini Admin menggunakan *Client-Side Pagination* (menarik maksimal 2000 data lalu membaginya di *browser*) demi mempercepat kecepatan UX dan *sorting*. Jika jumlah siswa melampaui 10,000, metode ini akan menyebabkan lonjakan memori (*bottleneck*). Disarankan beralih ke *Server-Side Pagination* jika kapasitas melampaui ambang batas ini di masa depan.
- **Bulk Import Password:** Pada import CSV, password di-*hash* secara massal. Karena `bcryptjs` sinkron (terbatas CPU), pembuatan akun massal (500+ entri baru) dapat menyebabkan CPU *Spike* dan Vercel *Timeout*. Proses ini sudah sedikit diringankan, namun untuk *scale* besar perlu diubah menjadi *Background Job/Queue*.
