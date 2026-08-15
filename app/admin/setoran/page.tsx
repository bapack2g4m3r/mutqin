'use client'
import { useState, useEffect, useCallback } from 'react'

interface Setoran {
  id: string; jenis: string; surah?: string; nilaiAkhir: number; predikat: string
  tanggal: string; isTasmi: boolean; catatan?: string
  bukuTahsin?: string; halamanTahsin?: string
  siswa: { nama: string; kelas: string; nis: string }
  guru: { user: { name: string } }
}

function PredikatBadge({ p }: { p: string }) {
  const cls = p === 'MUMTAZ' ? 'badge-mumtaz' : p === 'JAYYID_JIDDAN' ? 'badge-jayyidj' : p === 'JAYYID' ? 'badge-jayyid' : 'badge-ghair'
  const label = p === 'MUMTAZ' ? 'Mumtaz' : p === 'JAYYID_JIDDAN' ? 'Jayyid Jiddan' : p === 'JAYYID' ? 'Jayyid' : 'Ghair Maqbul'
  return <span className={`badge ${cls}`}>{label}</span>
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ConfirmDialog({ message, onConfirm, onCancel, loading }: {
  message: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, backdropFilter: 'blur(6px)', padding: '16px',
    }}>
      <div className="animate-scaleIn" style={{
        background: 'white', borderRadius: '20px', padding: '28px',
        width: '100%', maxWidth: '380px', textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Konfirmasi Hapus</h4>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>Batal</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} disabled={loading}>
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSetoranPage() {
  const [setorans, setSetorans] = useState<Setoran[]>([])
  const [kelasList, setKelasList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [jenis, setJenis] = useState('')
  const [kelas, setKelas] = useState('')
  const [search, setSearch] = useState('')
  const [searchGuru, setSearchGuru] = useState('')
  const [sortCol, setSortCol] = useState('tanggal')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [page, setPage] = useState(1)
  const itemsPerPage = 20
  const [showDelete, setShowDelete] = useState<Setoran | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchKelas = useCallback(async () => {
    try {
      const res = await fetch('/api/akademik')
      const data = await res.json()
      if (data.tahunAjaranList) {
        let classes: any[] = []
        data.tahunAjaranList.forEach((ta: any) => { if (ta.isAktif) classes = classes.concat(ta.kelas) })
        if (classes.length === 0 && data.tahunAjaranList.length > 0) classes = data.tahunAjaranList[0].kelas
        setKelasList(classes.sort((a: any, b: any) => a.nama.localeCompare(b.nama)).map((k: any) => k.nama))
      }
    } catch(e) {}
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '2000' })
    if (jenis) params.set('jenis', jenis)
    fetch(`/api/setoran?${params}`).then(r => r.json()).then(d => setSetorans(d.setorans || [])).finally(() => setLoading(false))
  }, [jenis])

  useEffect(() => { fetchKelas(); load() }, [load, fetchKelas])
  useEffect(() => { setPage(1) }, [search, kelas, jenis, searchGuru])

  async function handleDelete() {
    if (!showDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/setoran/${showDelete.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Gagal hapus'); return }
      showToast(`✓ Setoran "${showDelete.siswa.nama}" berhasil dihapus`)
      setShowDelete(null); load()
    } finally { setDeleting(false) }
  }

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: '4px', fontSize: '10px' }}>↕</span>
    return <span style={{ marginLeft: '4px', fontSize: '12px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // Client-side filter & sort
  const filtered = setorans.filter(s => {
    if (kelas && s.siswa.kelas !== kelas) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.siswa.nama.toLowerCase().includes(q) && !s.siswa.nis.toLowerCase().includes(q)) return false
    }
    if (searchGuru) {
      const qG = searchGuru.toLowerCase()
      if (!s.guru?.user?.name.toLowerCase().includes(qG)) return false
    }
    return true
  }).sort((a, b) => {
    let valA: any = ''
    let valB: any = ''
    switch(sortCol) {
      case 'siswa': valA = a.siswa.nama.toLowerCase(); valB = b.siswa.nama.toLowerCase(); break;
      case 'kelas': valA = a.siswa.kelas.toLowerCase(); valB = b.siswa.kelas.toLowerCase(); break;
      case 'jenis': valA = a.jenis.toLowerCase(); valB = b.jenis.toLowerCase(); break;
      case 'nilai': valA = a.nilaiAkhir; valB = b.nilaiAkhir; break;
      case 'guru': valA = a.guru?.user?.name.toLowerCase() || ''; valB = b.guru?.user?.name.toLowerCase() || ''; break;
      case 'tanggal': valA = new Date(a.tanggal).getTime(); valB = new Date(b.tanggal).getTime(); break;
      default: valA = new Date(a.tanggal).getTime(); valB = new Date(b.tanggal).getTime(); break;
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1
    if (valA > valB) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div style={{ padding: '32px', maxWidth: '1280px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Semua Setoran</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          {filtered.length === setorans.length ? `${setorans.length} setoran` : `Menampilkan ${filtered.length} dari ${setorans.length} setoran`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: '200px' }}>
          <span className="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Cari nama atau NIS siswa..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: '180px' }}>
          <span className="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Cari nama Guru..."
            value={searchGuru} onChange={e => setSearchGuru(e.target.value)} />
        </div>
        <select id="filter-setoran-jenis" className="input" value={jenis} onChange={e => setJenis(e.target.value)} style={{ width: '160px' }}>
          <option value="">Semua Jenis</option>
          <option value="TAHFIDZ">📖 Tahfidz</option>
          <option value="TAHSIN">🗣 Tahsin</option>
        </select>
        <select id="filter-setoran-kelas" className="input" value={kelas} onChange={e => setKelas(e.target.value)} style={{ width: '160px' }}>
          <option value="">Semua Kelas</option>
          {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => handleSort('siswa')} style={{ cursor: 'pointer', userSelect: 'none' }}>Siswa <SortIcon col="siswa"/></th>
              <th onClick={() => handleSort('kelas')} style={{ cursor: 'pointer', userSelect: 'none' }}>Kelas <SortIcon col="kelas"/></th>
              <th onClick={() => handleSort('jenis')} style={{ cursor: 'pointer', userSelect: 'none' }}>Jenis <SortIcon col="jenis"/></th>
              <th>Materi</th>
              <th onClick={() => handleSort('nilai')} style={{ cursor: 'pointer', userSelect: 'none' }}>Nilai <SortIcon col="nilai"/></th>
              <th>Predikat</th>
              <th onClick={() => handleSort('guru')} style={{ cursor: 'pointer', userSelect: 'none' }}>Guru <SortIcon col="guru"/></th>
              <th>Tasmi&apos;</th>
              <th onClick={() => handleSort('tanggal')} style={{ cursor: 'pointer', userSelect: 'none' }}>Tanggal <SortIcon col="tanggal"/></th>
              <th style={{ textAlign: 'center', width: '60px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 11 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Tidak ada data setoran</td></tr>
            ) : (
              currentData.map((s, index) => {
                const idx = (page - 1) * itemsPerPage + index
                return (
                <tr key={s.id}>
                  <td style={{ color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{s.siswa.nama}</td>
                  <td>
                    <span style={{ padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                      {s.siswa.kelas}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '6px',
                      background: s.jenis === 'TAHFIDZ' ? '#dbeafe' : '#fef3c7',
                      color: s.jenis === 'TAHFIDZ' ? '#1d4ed8' : '#b45309',
                    }}>
                      {s.jenis === 'TAHFIDZ' ? '📖 Tahfidz' : '🗣 Tahsin'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {s.jenis === 'TAHFIDZ' ? (s.surah || '—') : (s.bukuTahsin ? <>{s.bukuTahsin}{s.halamanTahsin && <span style={{ fontSize: '11px', color: '#94a3b8' }}> (Hal. {s.halamanTahsin})</span>}</> : '—')}
                  </td>
                  <td style={{ fontWeight: 700, color: s.nilaiAkhir >= 90 ? '#059669' : s.nilaiAkhir >= 80 ? '#2563eb' : s.nilaiAkhir >= 70 ? '#d97706' : '#dc2626' }}>
                    {Math.round(s.nilaiAkhir)}
                  </td>
                  <td><PredikatBadge p={s.predikat} /></td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>{s.guru.user.name}</td>
                  <td>
                    {s.isTasmi
                      ? <span style={{ color: '#059669', fontWeight: 600, fontSize: '12px' }}>✅ Ya</span>
                      : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(s.tanggal)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button title="Hapus setoran" onClick={() => setShowDelete(s)} style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: '#fee2e2', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626',
                      transition: 'all 0.15s',
                    }} onMouseOver={e => (e.currentTarget.style.background = '#fecaca')} onMouseOut={e => (e.currentTarget.style.background = '#fee2e2')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 8px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Menampilkan <span style={{ fontWeight: 600, color: '#1e293b' }}>{(page - 1) * itemsPerPage + 1}</span> - <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(page * itemsPerPage, filtered.length)}</span> dari <span style={{ fontWeight: 600, color: '#1e293b' }}>{filtered.length}</span> setoran
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

      {/* Toast */}
      {toast && <div className="toast" style={{ background: '#1e3a8a' }}>{toast}</div>}

      {/* Delete Confirm */}
      {showDelete && (
        <ConfirmDialog
          message={`Hapus setoran ${showDelete.jenis === 'TAHFIDZ' ? 'Tahfidz' : 'Tahsin'} milik "${showDelete.siswa.nama}" pada ${formatDate(showDelete.tanggal)}? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
