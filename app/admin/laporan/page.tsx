'use client'
import { useState, useEffect } from 'react'

interface Summary {
  siswa: { nama: string; kelas: string; nis: string }
  tahfidz: { count: number; totalNilai: number; lastNilai: number | null }
  tahsin:  { count: number; totalNilai: number; lastNilai: number | null }
}

export default function AdminLaporanPage() {
  const [data, setData] = useState<Summary[]>([])
  const [kelasList, setKelasList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [kelas, setKelas] = useState('')
  const [jenis, setJenis] = useState('')

  function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (kelas) p.set('kelas', kelas)
    if (jenis) p.set('jenis', jenis)
    fetch(`/api/laporan?${p}`).then(r => r.json()).then(d => setData(d.summary || [])).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/akademik').then(r => r.json()).then(d => {
      if (d.tahunAjaranList) {
        let classes: any[] = []
        d.tahunAjaranList.forEach((ta: any) => { if (ta.isAktif) classes = classes.concat(ta.kelas) })
        if (classes.length === 0 && d.tahunAjaranList.length > 0) classes = d.tahunAjaranList[0].kelas
        setKelasList(classes.sort((a: any, b: any) => a.nama.localeCompare(b.nama)).map((k: any) => k.nama))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => { load() }, [kelas, jenis])

  function exportCSV() {
    const headers = ['Nama','Kelas','NIS','Setoran Tahfidz','Rata Tahfidz','Setoran Tahsin','Rata Tahsin']
    const rows = data.map(d => [
      d.siswa.nama, d.siswa.kelas, d.siswa.nis,
      d.tahfidz.count,
      d.tahfidz.count ? Math.round(d.tahfidz.totalNilai / d.tahfidz.count) : '',
      d.tahsin.count,
      d.tahsin.count ? Math.round(d.tahsin.totalNilai / d.tahsin.count) : '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-mutqin-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const color = (v: number | null) =>
    v === null ? '#94a3b8' : v >= 90 ? '#059669' : v >= 80 ? '#2563eb' : v >= 70 ? '#d97706' : '#dc2626'

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Laporan Rekap</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Rekap nilai Tahfidz &amp; Tahsin per siswa</p>
        </div>
        <button id="btn-export-csv" className="btn btn-accent" onClick={exportCSV}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select id="filter-laporan-kelas" className="input" value={kelas} onChange={e => setKelas(e.target.value)} style={{ width: '160px' }}>
          <option value="">Semua Kelas</option>
          {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select id="filter-laporan-jenis" className="input" value={jenis} onChange={e => setJenis(e.target.value)} style={{ width: '160px' }}>
          <option value="">Semua Jenis</option>
          <option value="TAHFIDZ">Tahfidz</option>
          <option value="TAHSIN">Tahsin</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Nama Siswa</th><th>Kelas</th><th>NIS</th>
              <th>Setoran Tahfidz</th><th>Rata-rata Tahfidz</th>
              <th>Setoran Tahsin</th><th>Rata-rata Tahsin</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} /></td>
                ))}</tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Tidak ada data laporan</td></tr>
            ) : (
              data.map((d, idx) => {
                const avgTahfidz = d.tahfidz.count ? Math.round(d.tahfidz.totalNilai / d.tahfidz.count) : null
                const avgTahsin  = d.tahsin.count  ? Math.round(d.tahsin.totalNilai  / d.tahsin.count)  : null
                return (
                  <tr key={idx}>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.siswa.nama}</td>
                    <td>
                      <span style={{ padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                        {d.siswa.kelas}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: '#64748b' }}>{d.siswa.nis}</td>
                    <td style={{ textAlign: 'center' }}>{d.tahfidz.count || '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: color(avgTahfidz) }}>{avgTahfidz ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{d.tahsin.count || '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: color(avgTahsin) }}>{avgTahsin ?? '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
