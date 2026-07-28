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
          body { background: white; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; }
          @page { size: A4 portrait; margin: 20mm; }
          .print-header { border-bottom: 3px solid black; padding-bottom: 12px; margin-bottom: 16px; }
          .print-header h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; }
          .print-header h2 { margin: 4px 0 0 0; font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #1e3a8a; }
          .print-header p { margin: 4px 0 0 0; font-size: 11px; }
          .title-section { text-align: center; margin-bottom: 24px; }
          .title-section h3 { margin: 0; font-size: 14px; text-transform: uppercase; font-weight: normal; }
          .title-section h4 { margin: 4px 0 0 0; font-size: 16px; font-weight: bold; }
          .table-rapor { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          .table-rapor th, .table-rapor td { border: 1px solid black; padding: 8px; text-align: center; }
          .table-rapor th { background-color: #f1f5f9 !important; font-weight: bold; -webkit-print-color-adjust: exact; }
          .table-rapor .text-left { text-align: left; }
          .table-rapor .section-title { background-color: #e2e8f0 !important; font-weight: bold; text-align: left; -webkit-print-color-adjust: exact; }
          .table-rapor .total-row { background-color: #cbd5e1 !important; font-weight: bold; -webkit-print-color-adjust: exact; }
          .keterangan-box { border: 1px solid black; padding: 12px; width: max-content; font-size: 11px; margin-bottom: 32px; }
          .ttd-section { display: flex; justify-content: flex-end; margin-top: 40px; font-size: 12px; }
          .ttd-box { text-align: left; width: 200px; }
          .ttd-box .nama-ttd { font-weight: bold; border-bottom: 1px solid black; display: inline-block; padding-bottom: 2px; margin-top: 60px; }
        }
        
        .print-container {
          background: white;
          max-width: 210mm;
          min-height: 297mm;
          margin: 40px auto;
          padding: 20mm;
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
        <div className="print-header" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>LOGO</span>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1>SEKOLAH MENENGAH PERTAMA (SMP)</h1>
            <h2>GLOBAL INSANI SCHOOL</h2>
            <p style={{ fontWeight: 'bold' }}>Terakreditasi A</p>
            <p>Jl. Cendrawasih No. 10 Tajurhalang – Bogor 16320. Tlp : (0251) 8555657</p>
            <p>NSS : 202020237406 | NPSN : 2023219 | Email: smpgis15@gmail.com</p>
          </div>
        </div>

        {/* JUDUL */}
        <div className="title-section">
          <h3>HASIL PENILAIAN TAHSIN TAHFIZH AL QURAN</h3>
          <h3>TENGAH SEMESTER</h3>
          <h3>SMP GLOBAL INSANI SCHOOL</h3>
          <h4>TAHUN PELAJARAN {s.kelasRef?.tahunAjaran?.nama || '-'}</h4>
        </div>

        {/* INFO SISWA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '12px' }}>
          <table style={{ width: '45%' }}>
            <tbody>
              <tr><td style={{ width: '100px' }}>Alamat</td><td style={{ width: '10px' }}>:</td><td>Jl. Cendrawasih No.4</td></tr>
              <tr><td>Nama</td><td>:</td><td style={{ fontWeight: 'bold' }}>{s.nama}</td></tr>
              <tr><td>Nomor Induk</td><td>:</td><td>{s.nis}</td></tr>
            </tbody>
          </table>
          <table style={{ width: '45%' }}>
            <tbody>
              <tr><td style={{ width: '100px' }}>Kelas</td><td style={{ width: '10px' }}>:</td><td>{s.kelasRef?.nama || '-'}</td></tr>
              <tr><td>Semester</td><td>:</td><td>Ganjil</td></tr>
              <tr><td>Tahun Pelajaran</td><td>:</td><td>{s.kelasRef?.tahunAjaran?.nama || '-'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* TABEL NILAI */}
        <table className="table-rapor">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>NO</th>
              <th>PENILAIAN</th>
              <th style={{ width: '80px' }}>KKM</th>
              <th style={{ width: '80px' }}>NILAI</th>
              <th style={{ width: '80px' }}>GRADE</th>
              <th style={{ width: '120px' }}>KRITERIA</th>
            </tr>
          </thead>
          <tbody>
            {/* TAHFIDZ */}
            <tr><td colSpan={6} className="section-title">TAHFIDZ</td></tr>
            {r.tahfidz.komponen.map((k, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="text-left">{k.nama}</td>
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
              <td>{r.tahfidz.predikat.grade}</td>
              <td>{r.tahfidz.nilaiAkhir > 0 ? r.tahfidz.predikat.label : '-'}</td>
            </tr>

            {/* TAHSIN */}
            <tr><td colSpan={6} className="section-title">TAHSIN</td></tr>
            {r.tahsin.komponen.map((k, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="text-left">{k.nama}</td>
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
              <td>{r.tahsin.predikat.grade}</td>
              <td>{r.tahsin.nilaiAkhir > 0 ? r.tahsin.predikat.label : '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* KETERANGAN */}
        <div className="keterangan-box">
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Grade:</div>
          <table cellPadding={2}>
            <tbody>
              <tr><td width="80">A : 90 - 100</td><td>Sangat Baik Sekali (Mumtaz)</td></tr>
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
            <div>Guru Halaqah Tahfizh</div>
            <div className="nama-ttd">{s.halaqah?.guru?.user?.name || '_________________________'}</div>
          </div>
        </div>

      </div>
    </>
  )
}
