'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface RaporData {
  siswa: {
    nama: string
    nis: string
    kelasRef: {
      nama: string
      tahunAjaran: { nama: string }
    }
    halaqah?: {
      guru: { user: { name: string } }
    }
  }
  rapor: {
    tahfidz: {
      komponen: any[]
      nilaiAkhir: number
      predikat: { kode: string, label: string, grade: string }
    }
    tahsin: {
      komponen: any[]
      nilaiAkhir: number
      predikat: { kode: string, label: string, grade: string }
    }
  }
  semester: string
}

export default function RaporPrintPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<RaporData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/siswa/${id}/rapor`).then(r => r.json()).then(d => {
      if (!d.error) setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Memuat data rapor...</div>
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Data siswa tidak ditemukan.</div>

  const ts = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const s = data.siswa
  const r = data.rapor

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html { background: white !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          aside, .sidebar { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: auto !important; background: white !important; flex: none !important; display: block !important; }
          div[style*="display: flex"] { display: block !important; background: white !important; min-height: auto !important; }
          .print-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
        
        .print-container {
          background: white;
          max-width: 210mm;
          min-height: 297mm;
          margin: 40px auto;
          padding: 15mm;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          color: black;
          font-family: 'Times New Roman', Times, serif;
        }

        .btn-print {
          position: fixed;
          bottom: 40px;
          right: 40px;
          background: #2563eb;
          color: white;
          padding: 16px 32px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          border: none;
          z-index: 100;
          transition: all 0.2s;
        }
        .btn-print:hover { background: #1d4ed8; transform: translateY(-3px); }
        .btn-back {
          position: fixed;
          top: 40px;
          left: 40px;
          background: white;
          color: #64748b;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          z-index: 100;
        }
        .btn-back:hover { background: #f8fafc; }

        /* KOP SURAT */
        .kop-surat {
          border-bottom: 4px solid black;
          padding-bottom: 4px;
          margin-bottom: 12px;
        }
        .kop-surat-inner {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .kop-left {
          width: 140px;
          text-align: center;
        }
        .kop-logo {
          width: 70px;
          height: auto;
          margin: 0 auto;
        }
        .kop-contact {
          font-size: 10px;
          font-family: Arial, sans-serif;
          margin-top: 4px;
          text-align: left;
          font-weight: bold;
          line-height: 1.1;
        }
        .kop-center {
          flex: 1;
          text-align: center;
          padding: 0 10px;
        }
        .kop-center h1 {
          margin: 0;
          font-size: 16px;
          text-transform: uppercase;
        }
        .kop-center h2 {
          margin: 0;
          font-size: 20px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .kop-center p {
          margin: 2px 0;
          font-size: 11px;
        }
        .kop-center .akreditasi {
          font-size: 13px;
          font-weight: bold;
        }
        .kop-nss {
          width: 140px;
          font-size: 10px;
          font-weight: bold;
          text-align: right;
          font-family: Arial, sans-serif;
          padding-bottom: 2px;
          line-height: 1.2;
        }

        /* JUDUL */
        .judul-rapor {
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        /* INFO SISWA */
        .info-siswa {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 8px;
          font-family: 'Times New Roman', Times, serif;
        }
        .info-siswa table {
          width: 48%;
        }
        .info-siswa td {
          padding: 1px 0;
          vertical-align: top;
        }
        .info-siswa td:first-child {
          width: 90px;
        }
        .info-siswa td:nth-child(2) {
          width: 10px;
        }

        /* TABEL NILAI */
        .table-rapor {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 11px;
        }
        .table-rapor th, .table-rapor td {
          border: 1px solid black;
          padding: 4px;
          text-align: center;
        }
        .table-rapor th {
          font-weight: bold;
          -webkit-print-color-adjust: exact;
          text-transform: uppercase;
        }
        .table-rapor .text-left {
          text-align: left;
        }
        .table-rapor .section-title {
          background-color: #d1d5db !important;
          font-weight: bold;
          text-align: left;
          -webkit-print-color-adjust: exact;
        }
        .table-rapor .total-row {
          background-color: #9ca3af !important;
          font-weight: bold;
          -webkit-print-color-adjust: exact;
        }

        /* KETERANGAN */
        .keterangan-box {
          border: 1px solid black;
          padding: 4px 8px;
          width: max-content;
          font-size: 10px;
          margin-bottom: 12px;
          font-family: Arial, sans-serif;
          line-height: 1.1;
        }
        .keterangan-box table {
          border-collapse: collapse;
        }
        .keterangan-box td {
          padding: 1px 4px 1px 0;
          vertical-align: top;
        }

        /* TTD */
        .ttd-section {
          display: flex;
          justify-content: flex-end;
          font-size: 11px;
        }
        .ttd-box {
          text-align: left;
          width: 200px;
        }
        .ttd-box .nama-ttd {
          font-weight: bold;
          margin-top: 50px;
          display: inline-block;
        }
      `}} />

      <button className="btn-back no-print" onClick={() => router.back()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Kembali
      </button>

      <button className="btn-print no-print" onClick={() => window.print()}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Cetak Rapor (PDF)
      </button>

      <div className="print-container">
        {/* KOP SURAT */}
        <div className="kop-surat">
          <div className="kop-surat-inner">
            <div className="kop-left">
              <img src="/logo.png" alt="Logo" className="kop-logo" />
              <div className="kop-contact">
                <div>☎ 0251 8555657</div>
                <div>✉ SMP.GIS15@gmail.com</div>
              </div>
            </div>
            <div className="kop-center">
              <h1>SEKOLAH MENENGAH PERTAMA (SMP)</h1>
              <h2>GLOBAL INSANI SCHOOL</h2>
              <div className="akreditasi">Terakreditasi A</div>
              <p>Jl. Cendrawasih No. 10 Tajurhalang – Bogor 16320. Tlp : (0251) 8555657</p>
            </div>
            <div className="kop-nss">
              <div>NSS : 202020237406</div>
              <div>NPSN : 2023219</div>
            </div>
          </div>
        </div>

        {/* JUDUL */}
        <div className="judul-rapor">
          <div>HASIL PENILAIAN TAHSIN TAHFIZH AL QURAN</div>
          <div>TENGAH SEMESTER {data.semester || 'GANJIL'}</div>
          <div>SMP GLOBAL INSANI SCHOOL</div>
          <div>TAHUN PELAJARAN {s.kelasRef?.tahunAjaran?.nama || '-'}</div>
        </div>

        {/* INFO SISWA */}
        <div className="info-siswa">
          <table>
            <tbody>
              <tr><td>Alamat</td><td>:</td><td>Jl. Cendrawasih No.4</td></tr>
              <tr><td>N a m a</td><td>:</td><td style={{ textTransform: 'uppercase' }}>{s.nama}</td></tr>
              <tr><td>Nomor Induk</td><td>:</td><td>{s.nis}</td></tr>
            </tbody>
          </table>
          <table>
            <tbody>
              <tr><td>Kelas</td><td>:</td><td>{s.kelasRef?.nama || '-'}</td></tr>
              <tr><td>Semester</td><td>:</td><td style={{ textTransform: 'capitalize' }}>{data.semester ? data.semester.toLowerCase() : 'Ganjil'}</td></tr>
              <tr><td>Tahun Pelajaran</td><td>:</td><td>{s.kelasRef?.tahunAjaran?.nama || '-'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* TABEL NILAI */}
        <table className="table-rapor">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>NO</th>
              <th>PENILAIAN</th>
              <th style={{ width: '70px' }}>KKM</th>
              <th style={{ width: '70px' }}>NILAI</th>
              <th style={{ width: '70px' }}>GRADE</th>
              <th style={{ width: '150px' }}>KRITERIA</th>
            </tr>
          </thead>
          <tbody>
            {/* TAHFIDZ */}
            <tr><td colSpan={6} className="section-title">TAHFIDZ</td></tr>
            {r.tahfidz.komponen.map((k, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="text-left">{k.nama.toUpperCase()}</td>
                <td>{k.kkm}</td>
                <td>{k.nilai}</td>
                <td>{k.grade}</td>
                <td>{k.nilai > 0 ? k.label : '-'}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={2}>NILAI AKHIR</td>
              <td></td>
              <td>{r.tahfidz.nilaiAkhir}</td>
              <td colSpan={2}>{r.tahfidz.nilaiAkhir > 0 ? r.tahfidz.predikat.label : '-'}</td>
            </tr>

            {/* TAHSIN */}
            <tr><td colSpan={6} className="section-title">TAHSIN</td></tr>
            {r.tahsin.komponen.map((k, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="text-left">{k.nama.toUpperCase()}</td>
                <td>{k.kkm}</td>
                <td>{k.nilai}</td>
                <td>{k.grade}</td>
                <td>{k.nilai > 0 ? k.label : '-'}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={2}>NILAI AKHIR</td>
              <td></td>
              <td>{r.tahsin.nilaiAkhir}</td>
              <td colSpan={2}>{r.tahsin.nilaiAkhir > 0 ? r.tahsin.predikat.label : '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* KETERANGAN */}
        <div className="keterangan-box">
          <div style={{ marginBottom: '2px' }}>Grade:</div>
          <table cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr><td style={{ width: '85px', whiteSpace: 'nowrap' }}>A : 90 - 100</td><td>Sangat Baik Sekali (Mumtaz)</td></tr>
              <tr><td>B : 80 - 89</td><td>Baik Sekali (Jayyid Jiddan)</td></tr>
              <tr><td>C : 70 - 79</td><td>Baik (Jayyid)</td></tr>
              <tr><td>K : &lt; 70</td><td>Kurang (Ghair Maqbul)</td></tr>
            </tbody>
          </table>
        </div>

        {/* TTD */}
        <div className="ttd-section">
          <div className="ttd-box">
            <div style={{ marginBottom: '4px' }}>Tajurhalang, {ts}</div>
            <div>Wali Tahfizh</div>
            <div className="nama-ttd">
              {s.halaqah?.guru?.user?.name || '_________________________'}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
