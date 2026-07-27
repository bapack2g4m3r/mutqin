'use client'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Summary {
  siswa: { nama: string; kelas: string; nis: string }
  tahfidz: { count: number; totalNilai: number; lastNilai: number | null }
  tahsin:  { count: number; totalNilai: number; lastNilai: number | null; lastBukuTahsin: string | null }
}

export default function AdminLaporanPage() {
  const [data, setData] = useState<Summary[]>([])
  const [kelasList, setKelasList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [kelas, setKelas] = useState('')
  const [jenis, setJenis] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 20
  type SortKey = 'nama' | 'kelas' | 'tahfidz' | 'avgTahfidz' | 'bukuTahsin' | 'tahsin' | 'avgTahsin'
  const [sortKey, setSortKey] = useState<SortKey>('nama')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortOrder('asc') }
  }

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span style={{ color: '#cbd5e1', marginLeft: '4px', fontSize: '12px' }}>↕</span>
    return <span style={{ color: '#1d4ed8', marginLeft: '4px', fontSize: '12px' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (kelas) p.set('kelas', kelas)
    if (jenis) p.set('jenis', jenis)
    if (dateFrom) p.set('from', dateFrom)
    if (dateTo) p.set('to', dateTo)
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

  useEffect(() => { load() }, [kelas, jenis, dateFrom, dateTo])
  useEffect(() => { setPage(1) }, [search, kelas, jenis, dateFrom, dateTo])

  function exportExcel() {
    const headers = ['Nama', 'Kelas', 'NIS', 'Setoran Tahfidz', 'Rata Tahfidz', 'Buku Tahsin Terakhir', 'Setoran Tahsin', 'Rata Tahsin']
    const rows = filtered.map(d => [
      d.siswa.nama, d.siswa.kelas, d.siswa.nis,
      d.tahfidz.count,
      d.tahfidz.count ? Math.round(d.tahfidz.totalNilai / d.tahfidz.count) : '',
      d.tahsin.lastBukuTahsin || '',
      d.tahsin.count,
      d.tahsin.count ? Math.round(d.tahsin.totalNilai / d.tahsin.count) : '',
    ])
    
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Rekap")
    XLSX.writeFile(wb, `laporan-mutqin-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function exportPDF() {
    const doc = new jsPDF('landscape')
    doc.setFontSize(16)
    doc.text('Laporan Rekap Setoran Tahfidz & Tahsin', 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 28)

    const headers = [['No', 'Nama Siswa', 'Kelas', 'NIS', 'Jml Tahfidz', 'Rata Tahfidz', 'Buku Tahsin', 'Jml Tahsin', 'Rata Tahsin']]
    const rows = filtered.map((d, i) => [
      i + 1,
      d.siswa.nama, d.siswa.kelas, d.siswa.nis,
      d.tahfidz.count || '-',
      d.tahfidz.count ? Math.round(d.tahfidz.totalNilai / d.tahfidz.count) : '-',
      d.tahsin.lastBukuTahsin || '-',
      d.tahsin.count || '-',
      d.tahsin.count ? Math.round(d.tahsin.totalNilai / d.tahsin.count) : '-',
    ])

    autoTable(doc, {
      startY: 35,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 }
    })

    doc.save(`laporan-mutqin-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const color = (v: number | null) =>
    v === null ? '#94a3b8' : v >= 90 ? '#059669' : v >= 80 ? '#2563eb' : v >= 70 ? '#d97706' : '#dc2626'

  const avgCalc = (count: number, total: number) => count ? Math.round(total / count) : null

  // Client-side filter & sort
  const filtered = data.filter(d => {
    if (search) {
      const q = search.toLowerCase()
      if (!d.siswa.nama.toLowerCase().includes(q) && !d.siswa.nis.toLowerCase().includes(q)) return false
    }
    return true
  }).sort((a, b) => {
    let valA: any = '', valB: any = ''
    if (sortKey === 'nama') { valA = a.siswa.nama; valB = b.siswa.nama }
    else if (sortKey === 'kelas') { valA = a.siswa.kelas; valB = b.siswa.kelas }
    else if (sortKey === 'tahfidz') { valA = a.tahfidz.count; valB = b.tahfidz.count }
    else if (sortKey === 'avgTahfidz') { valA = avgCalc(a.tahfidz.count, a.tahfidz.totalNilai) || 0; valB = avgCalc(b.tahfidz.count, b.tahfidz.totalNilai) || 0 }
    else if (sortKey === 'bukuTahsin') { valA = a.tahsin.lastBukuTahsin || ''; valB = b.tahsin.lastBukuTahsin || '' }
    else if (sortKey === 'tahsin') { valA = a.tahsin.count; valB = b.tahsin.count }
    else if (sortKey === 'avgTahsin') { valA = avgCalc(a.tahsin.count, a.tahsin.totalNilai) || 0; valB = avgCalc(b.tahsin.count, b.tahsin.totalNilai) || 0 }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div style={{ padding: '32px', maxWidth: '1280px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Laporan Rekap</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {filtered.length === data.length ? `Rekap ${data.length} siswa` : `Menampilkan ${filtered.length} dari ${data.length} siswa`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button id="btn-export-excel" className="btn btn-outline" onClick={exportExcel} style={{ color: '#059669', borderColor: '#059669' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            Excel
          </button>
          <button id="btn-export-pdf" className="btn btn-outline" onClick={exportPDF} style={{ color: '#dc2626', borderColor: '#dc2626' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="M9 15v-4"/><path d="M12 15v-4"/><path d="M15 15v-4"/>
            </svg>
            PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: '200px' }}>
          <span className="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Cari nama atau NIS..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="filter-laporan-kelas" className="input" value={kelas} onChange={e => setKelas(e.target.value)} style={{ width: '160px' }}>
          <option value="">Semua Kelas</option>
          {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select id="filter-laporan-jenis" className="input" value={jenis} onChange={e => setJenis(e.target.value)} style={{ width: '160px' }}>
          <option value="">Semua Jenis</option>
          <option value="TAHFIDZ">Tahfidz</option>
          <option value="TAHSIN">Tahsin</option>
        </select>
        <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} title="Dari tanggal" />
        <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} title="Sampai tanggal" />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => handleSort('nama')} style={{ cursor: 'pointer', userSelect: 'none' }}>Nama Siswa {renderSortIcon('nama')}</th>
              <th onClick={() => handleSort('kelas')} style={{ cursor: 'pointer', userSelect: 'none' }}>Kelas {renderSortIcon('kelas')}</th>
              <th>NIS</th>
              <th onClick={() => handleSort('tahfidz')} style={{ cursor: 'pointer', userSelect: 'none' }}>Setoran Tahfidz {renderSortIcon('tahfidz')}</th>
              <th onClick={() => handleSort('avgTahfidz')} style={{ cursor: 'pointer', userSelect: 'none' }}>Rata-rata Tahfidz {renderSortIcon('avgTahfidz')}</th>
              <th onClick={() => handleSort('bukuTahsin')} style={{ cursor: 'pointer', userSelect: 'none' }}>Buku Tahsin {renderSortIcon('bukuTahsin')}</th>
              <th onClick={() => handleSort('tahsin')} style={{ cursor: 'pointer', userSelect: 'none' }}>Setoran Tahsin {renderSortIcon('tahsin')}</th>
              <th onClick={() => handleSort('avgTahsin')} style={{ cursor: 'pointer', userSelect: 'none' }}>Rata-rata Tahsin {renderSortIcon('avgTahsin')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Tidak ada data laporan</td></tr>
            ) : (
              currentData.map((d, index) => {
                const idx = (page - 1) * itemsPerPage + index
                const avgTahfidz = avgCalc(d.tahfidz.count, d.tahfidz.totalNilai)
                const avgTahsin  = avgCalc(d.tahsin.count, d.tahsin.totalNilai)
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
                    <td style={{ textAlign: 'center', fontSize: '12px' }}>{d.tahsin.lastBukuTahsin ? <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '6px', fontWeight: 600 }}>{d.tahsin.lastBukuTahsin}</span> : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{d.tahsin.count || '—'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: color(avgTahsin) }}>{avgTahsin ?? '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 8px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Menampilkan <span style={{ fontWeight: 600, color: '#1e293b' }}>{(page - 1) * itemsPerPage + 1}</span> - <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(page * itemsPerPage, filtered.length)}</span> dari <span style={{ fontWeight: 600, color: '#1e293b' }}>{filtered.length}</span> siswa
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px' }} disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Sebelumnya</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: page === p ? '#1d4ed8' : 'transparent', color: page === p ? 'white' : '#64748b', fontWeight: page === p ? 700 : 500, transition: 'all 0.15s' }} onMouseOver={e => { if (page !== p) e.currentTarget.style.background = '#f1f5f9' }} onMouseOut={e => { if (page !== p) e.currentTarget.style.background = 'transparent' }}>{p}</button>
                  )
                } else if (p === page - 2 || p === page + 2) {
                  return <span key={p} style={{ color: '#94a3b8', padding: '0 4px' }}>...</span>
                }
                return null;
              })}
            </div>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px' }} disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Selanjutnya</button>
          </div>
        </div>
      )}
    </div>
  )
}

