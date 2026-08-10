'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SiswaItem {
  id: string
  nis: string
  nama: string
  kelas: string
  halaqah?: {
    guru: {
      user: { name: string }
    }
  }
}

interface RaporResult {
  siswa: any
  rapor: {
    tahfidz: {
      komponen: any[]
      nilaiAkhir: number
      predikat: { kode: string; label: string; grade: string }
    }
    tahsin: {
      komponen: any[]
      nilaiAkhir: number
      predikat: { kode: string; label: string; grade: string }
    }
  }
}

export default function RaporMassalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialKelas = searchParams.get('kelas') || ''

  // Filter States
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([])
  const [kelasList, setKelasList] = useState<string[]>([])
  const [selectedJenjang, setSelectedJenjang] = useState<string>('Semua')
  const [selectedKelas, setSelectedKelas] = useState<string>(initialKelas)
  const [search, setSearch] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Print Mode States
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [raporData, setRaporData] = useState<RaporResult[]>([])
  const [semesterName, setSemesterName] = useState('GANJIL')
  const [loadingRapor, setLoadingRapor] = useState(false)

  // Fetch classes and students
  useEffect(() => {
    async function initData() {
      setLoading(true)
      try {
        const [akademikRes, siswaRes] = await Promise.all([
          fetch('/api/akademik').then(r => r.json()),
          fetch('/api/siswa?limit=500').then(r => r.json())
        ])

        if (akademikRes.tahunAjaranList) {
          let classes: any[] = []
          akademikRes.tahunAjaranList.forEach((ta: any) => {
            if (ta.isAktif) classes = classes.concat(ta.kelas)
          })
          if (classes.length === 0 && akademikRes.tahunAjaranList.length > 0) {
            classes = akademikRes.tahunAjaranList[0].kelas
          }
          const sorted = classes.sort((a: any, b: any) => a.nama.localeCompare(b.nama)).map((k: any) => k.nama)
          setKelasList(sorted)
        }

        const sList: SiswaItem[] = siswaRes.siswa || []
        setSiswaList(sList)

        // If initial class provided, pre-select all students in that class
        if (initialKelas) {
          const matchIds = sList.filter(s => s.kelas === initialKelas).map(s => s.id)
          setSelectedIds(new Set(matchIds))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [initialKelas])

  // Filtered Siswa List
  const filteredSiswa = useMemo(() => {
    return siswaList.filter(s => {
      // Filter Jenjang (Tingkat: 7, 8, 9)
      if (selectedJenjang !== 'Semua') {
        const firstChar = s.kelas.trim()[0]
        if (firstChar !== selectedJenjang) return false
      }
      // Filter Kelas
      if (selectedKelas && s.kelas !== selectedKelas) return false
      // Filter Search
      if (search) {
        const q = search.toLowerCase()
        const matchNama = s.nama.toLowerCase().includes(q)
        const matchNis = s.nis.includes(q)
        if (!matchNama && !matchNis) return false
      }
      return true
    })
  }, [siswaList, selectedJenjang, selectedKelas, search])

  // Select all / Deselect all for filtered items
  const isAllFilteredSelected = filteredSiswa.length > 0 && filteredSiswa.every(s => selectedIds.has(s.id))

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds)
    if (isAllFilteredSelected) {
      filteredSiswa.forEach(s => next.delete(s.id))
    } else {
      filteredSiswa.forEach(s => next.add(s.id))
    }
    setSelectedIds(next)
  }

  const handleToggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSelectAllInClass = (kelasName: string) => {
    const next = new Set(selectedIds)
    siswaList.filter(s => s.kelas === kelasName).forEach(s => next.add(s.id))
    setSelectedIds(next)
  }

  // Load Bulk Rapor Data and Switch to Print View
  const handleProceedToPrint = async () => {
    if (selectedIds.size === 0) {
      alert('Pilih minimal 1 siswa untuk dicetak rapor.')
      return
    }

    setLoadingRapor(true)
    try {
      const res = await fetch('/api/rapor/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswaIds: Array.from(selectedIds) })
      })
      const data = await res.json()
      if (data.results) {
        setRaporData(data.results)
        setSemesterName(data.semester || 'GANJIL')
        setIsPrintMode(true)
      } else {
        alert('Gagal memuat data rapor siswa.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat memproses data rapor.')
    } finally {
      setLoadingRapor(false)
    }
  }

  const tanggalStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PRINT VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPrintMode) {
    return (
      <>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body, html { background: white !important; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            aside, .sidebar { display: none !important; }
            main { margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: auto !important; background: white !important; flex: none !important; display: block !important; }
            div[style*="display: flex"] { display: block !important; background: white !important; min-height: auto !important; }
            
            .rapor-page {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: always !important;
              break-after: page !important;
            }
            .rapor-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            @page { size: A4 portrait; margin: 15mm; }
          }

          .print-nav-bar {
            position: sticky;
            top: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid #e2e8f0;
            padding: 14px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }

          .rapor-page {
            background: white;
            max-width: 210mm;
            min-height: 297mm;
            margin: 30px auto;
            padding: 15mm;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            color: black;
            font-family: 'Times New Roman', Times, serif;
          }

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

        {/* Top Control Bar */}
        <div className="print-nav-bar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsPrintMode(false)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Kembali ke Pemilihan
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>Pratinjau Cetak Rapor Massal</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total {raporData.length} Rapor Siap Dicetak (1 Siswa = 1 Lembar A4)</div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Cetak Semua Rapor ({raporData.length} Lembar)
          </button>
        </div>

        {/* Multi-page Reports */}
        <div style={{ background: '#e2e8f0', padding: '20px 0' }}>
          {raporData.map(({ siswa, rapor }, idx) => (
            <div key={siswa.id || idx} className="rapor-page">
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
                <div>TENGAH SEMESTER {semesterName}</div>
                <div>SMP GLOBAL INSANI SCHOOL</div>
                <div>TAHUN PELAJARAN {siswa.kelasRef?.tahunAjaran?.nama || '-'}</div>
              </div>

              {/* INFO SISWA */}
              <div className="info-siswa">
                <table>
                  <tbody>
                    <tr><td>Alamat</td><td>:</td><td>Jl. Cendrawasih No.4</td></tr>
                    <tr><td>N a m a</td><td>:</td><td style={{ textTransform: 'uppercase' }}>{siswa.nama}</td></tr>
                    <tr><td>Nomor Induk</td><td>:</td><td>{siswa.nis}</td></tr>
                  </tbody>
                </table>
                <table>
                  <tbody>
                    <tr><td>Kelas</td><td>:</td><td>{siswa.kelasRef?.nama || siswa.kelas || '-'}</td></tr>
                    <tr><td>Semester</td><td>:</td><td style={{ textTransform: 'capitalize' }}>{semesterName ? semesterName.toLowerCase() : 'Ganjil'}</td></tr>
                    <tr><td>Tahun Pelajaran</td><td>:</td><td>{siswa.kelasRef?.tahunAjaran?.nama || '-'}</td></tr>
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
                  {rapor.tahfidz.komponen.map((k: any, i: number) => (
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
                    <td>{rapor.tahfidz.nilaiAkhir}</td>
                    <td colSpan={2}>{rapor.tahfidz.nilaiAkhir > 0 ? rapor.tahfidz.predikat.label : '-'}</td>
                  </tr>

                  {/* TAHSIN */}
                  <tr><td colSpan={6} className="section-title">TAHSIN</td></tr>
                  {rapor.tahsin.komponen.map((k: any, i: number) => (
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
                    <td>{rapor.tahsin.nilaiAkhir}</td>
                    <td colSpan={2}>{rapor.tahsin.nilaiAkhir > 0 ? rapor.tahsin.predikat.label : '-'}</td>
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
                  <div style={{ marginBottom: '4px' }}>Tajurhalang, {tanggalStr}</div>
                  <div>Wali Tahfizh</div>
                  <div className="nama-ttd">
                    {siswa.halaqah?.guru?.user?.name || '_________________________'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: SELECTION & FILTER VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            onClick={() => router.back()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Kembali
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Cetak Rapor Massal</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Pilih jenjang, kelas, atau centang siswa secara spesifik untuk mencetak rapor sekaligus.
          </p>
        </div>

        <button
          onClick={handleProceedToPrint}
          disabled={selectedIds.size === 0 || loadingRapor}
          className="btn btn-primary"
          style={{
            padding: '12px 28px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: selectedIds.size === 0 ? 0.6 : 1,
            cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          {loadingRapor ? 'Memproses...' : `Cetak Rapor (${selectedIds.size} Siswa)`}
        </button>
      </div>

      {/* Filter Controls Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        {/* Jenjang Filter Buttons */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter Jenjang / Tingkat:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Semua', '7', '8', '9'].map(j => {
              const active = selectedJenjang === j
              return (
                <button
                  key={j}
                  onClick={() => {
                    setSelectedJenjang(j)
                    setSelectedKelas('') // reset kelas filter when jenjang changes
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    border: active ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
                    background: active ? '#1e3a8a' : 'white',
                    color: active ? 'white' : '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {j === 'Semua' ? 'Semua Jenjang' : `Kelas ${j}`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Kelas & Search Filter */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pilih Kelas Spesifik:
            </label>
            <select
              value={selectedKelas}
              onChange={e => setSelectedKelas(e.target.value)}
              className="input"
              style={{ width: '100%' }}
            >
              <option value="">Semua Kelas</option>
              {kelasList
                .filter(k => selectedJenjang === 'Semua' || k.startsWith(selectedJenjang))
                .map(k => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cari Nama / NIS:
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ketik nama atau NIS siswa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleToggleSelectAll}
              className="btn btn-outline"
              style={{ flex: 1, fontSize: '13px', padding: '10px 14px' }}
            >
              {isAllFilteredSelected ? 'Batal Pilih Semua' : `Pilih Semua (${filteredSiswa.length})`}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-ghost"
              style={{ fontSize: '13px', padding: '10px 14px', color: '#dc2626' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
            Daftar Siswa ({filteredSiswa.length} ditemukan)
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a', background: '#dbeafe', padding: '4px 12px', borderRadius: '20px' }}>
            {selectedIds.size} siswa terpilih
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Memuat daftar siswa...
          </div>
        ) : filteredSiswa.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Tidak ada siswa yang sesuai dengan filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ width: '50px', padding: '12px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>NIS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>NAMA SISWA</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>KELAS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>WALI TAHFIZH / GURU</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiswa.map((s, i) => {
                  const isChecked = selectedIds.has(s.id)
                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleToggleOne(s.id)}
                      style={{
                        background: isChecked ? '#eff6ff' : (i % 2 === 0 ? 'white' : '#f8fafc'),
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOne(s.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>{s.nis}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{s.nama}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                        <span style={{ background: '#e2e8f0', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '12px' }}>
                          Kelas {s.kelas}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                        {s.halaqah?.guru?.user?.name || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <a
                          href={`/admin/siswa/${s.id}/rapor`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                        >
                          Lihat Rapor Satuan ↗
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
