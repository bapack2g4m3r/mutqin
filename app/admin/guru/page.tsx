'use client'
import { useState, useEffect, useCallback } from 'react'

interface Guru {
  id: string; nip?: string; kelas: string
  user: { id: string; name: string; email: string }
  setorans: { id: string }[]
}

const EMPTY_FORM = { nama: '', email: '', password: '', nip: '', kelas: [] as string[] }

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(6px)', padding: '16px',
    }}>
      <div className="animate-scaleIn" style={{
        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '520px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 0' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px', borderRadius: '8px' }}
            onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: '20px 28px 28px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
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

function GuruForm({ initial, isEdit, onSave, onClose, saving, kelasList }: {
  initial: { nama: string; email: string; password: string; nip: string; kelas: string[] }
  isEdit: boolean
  onSave: (data: typeof initial) => void
  onClose: () => void
  saving: boolean
  kelasList: string[]
}) {
  const [form, setForm] = useState(initial)
  const [showPass, setShowPass] = useState(false)

  function toggleKelas(k: string) {
    setForm(p => ({
      ...p,
      kelas: p.kelas.includes(k) ? p.kelas.filter(x => x !== k) : [...p.kelas, k],
    }))
  }

  const valid = form.nama && form.email && (!isEdit || form.password === '' || form.password.length >= 6) && (!isEdit && form.password.length >= 6 || isEdit)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="input-group">
        <label className="input-label">Nama Lengkap <span style={{ color: '#dc2626' }}>*</span></label>
        <input id="guru-form-nama" type="text" className="input" placeholder="Nama guru"
          value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} />
      </div>
      <div className="input-group">
        <label className="input-label">Email <span style={{ color: '#dc2626' }}>*</span></label>
        <input id="guru-form-email" type="email" className="input" placeholder="guru@globalinsani.sch.id"
          value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      </div>
      <div className="input-group">
        <label className="input-label">
          Password {isEdit && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(kosongkan jika tidak diubah)</span>}
          {!isEdit && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
        <div style={{ position: 'relative' }}>
          <input id="guru-form-password" type={showPass ? 'text' : 'password'} className="input"
            placeholder={isEdit ? '••••••••' : 'Min. 6 karakter'}
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            style={{ paddingRight: '44px' }} />
          <button type="button" onClick={() => setShowPass(!showPass)} style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showPass
                ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
            </svg>
          </button>
        </div>
      </div>
      <div className="input-group">
        <label className="input-label">NIP <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opsional)</span></label>
        <input id="guru-form-nip" type="text" className="input" placeholder="Nomor Induk Pegawai"
          value={form.nip} onChange={e => setForm(p => ({ ...p, nip: e.target.value }))} />
      </div>
      <div className="input-group">
        <label className="input-label">Kelas yang Diampu</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {kelasList.map(k => {
            const active = form.kelas.includes(k)
            return (
              <button key={k} type="button" onClick={() => toggleKelas(k)} style={{
                padding: '6px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                border: `1.5px solid ${active ? '#1d4ed8' : '#e2e8f0'}`,
                background: active ? '#dbeafe' : 'white',
                color: active ? '#1d4ed8' : '#64748b',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {k}
              </button>
            )
          })}
        </div>
        {form.kelas.length === 0 && (
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>Belum ada kelas dipilih</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Batal</button>
        <button id="btn-save-guru" className="btn btn-primary" style={{ flex: 1 }}
          onClick={() => onSave(form)} disabled={saving || !form.nama || !form.email}>
          {saving ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Menyimpan...</> : 'Simpan'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminGuruPage() {
  const [gurus, setGurus]     = useState<Guru[]>([])
  const [kelasList, setKelasList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit]   = useState<Guru | null>(null)
  const [showDelete, setShowDelete] = useState<Guru | null>(null)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast]     = useState('')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const itemsPerPage = 15
  type SortKey = 'nama' | 'email' | 'nip' | 'totalSetoran'
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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { setPage(1) }, [search])

  const fetchKelas = useCallback(async () => {
    try {
      const res = await fetch('/api/akademik')
      const data = await res.json()
      if (data.tahunAjaranList) {
        let classes: any[] = []
        data.tahunAjaranList.forEach((ta: any) => {
          if (ta.isAktif) classes = classes.concat(ta.kelas)
        })
        if (classes.length === 0 && data.tahunAjaranList.length > 0) {
          classes = data.tahunAjaranList[0].kelas
        }
        setKelasList(classes.sort((a: any, b: any) => a.nama.localeCompare(b.nama)).map((k: any) => k.nama))
      }
    } catch(e) {}
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/guru').then(r => r.json()).then(d => setGurus(d.gurus || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchKelas(); load() }, [load, fetchKelas])

  async function handleAdd(form: typeof EMPTY_FORM) {
    setSaving(true)
    try {
      const res = await fetch('/api/guru', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Gagal tambah guru'); return }
      showToast(`✓ Guru "${form.nama}" berhasil ditambahkan`)
      setShowAdd(false); load()
    } finally { setSaving(false) }
  }

  async function handleEdit(form: typeof EMPTY_FORM) {
    if (!showEdit) return
    setSaving(true)
    try {
      const payload: any = { nama: form.nama, email: form.email, nip: form.nip, kelas: form.kelas }
      if (form.password) payload.password = form.password
      const res = await fetch(`/api/guru/${showEdit.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Gagal update'); return }
      showToast(`✓ Data "${form.nama}" berhasil diperbarui`)
      setShowEdit(null); load()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!showDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/guru/${showDelete.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Gagal hapus'); return }
      showToast(`✓ Guru "${showDelete.user.name}" berhasil dihapus`)
      setShowDelete(null); load()
    } finally { setDeleting(false) }
  }

  function getEditInitial(g: Guru): typeof EMPTY_FORM {
    let kelasList: string[] = []
    try { kelasList = JSON.parse(g.kelas || '[]') } catch {}
    return { nama: g.user.name, email: g.user.email, password: '', nip: g.nip || '', kelas: kelasList }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Data Guru</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{gurus.length} guru terdaftar</p>
        </div>
        <button id="btn-tambah-guru" className="btn btn-primary" onClick={() => setShowAdd(true)}
          style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Tambah Guru
        </button>
      </div>

      {/* Filter Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div className="input-icon-wrap" style={{ flex: 1, maxWidth: '400px' }}>
          <span className="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input type="search" className="input" placeholder="Cari nama, email, atau NIP..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Tabel Guru */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th onClick={() => handleSort('nama')} style={{ cursor: 'pointer', userSelect: 'none' }}>Nama Guru {renderSortIcon('nama')}</th>
              <th onClick={() => handleSort('email')} style={{ cursor: 'pointer', userSelect: 'none' }}>Kontak & NIP {renderSortIcon('email')}</th>
              <th>Kelas Diampu</th>
              <th onClick={() => handleSort('totalSetoran')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>Total Setoran {renderSortIcon('totalSetoran')}</th>
              <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} /></td>
                ))}</tr>
              ))
            ) : (() => {
              const filteredGurus = gurus.filter(g => 
                g.user.name.toLowerCase().includes(search.toLowerCase()) || 
                g.user.email.toLowerCase().includes(search.toLowerCase()) ||
                (g.nip && g.nip.toLowerCase().includes(search.toLowerCase()))
              ).sort((a, b) => {
                let valA: any = ''
                let valB: any = ''
                if (sortKey === 'nama') { valA = a.user.name; valB = b.user.name }
                else if (sortKey === 'email') { valA = a.user.email; valB = b.user.email }
                else if (sortKey === 'nip') { valA = a.nip || ''; valB = b.nip || '' }
                else if (sortKey === 'totalSetoran') { valA = a.setorans?.length || 0; valB = b.setorans?.length || 0 }
                
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1
                return 0
              })
              const totalPages = Math.ceil(filteredGurus.length / itemsPerPage)
              const currentData = filteredGurus.slice((page - 1) * itemsPerPage, page * itemsPerPage)

              if (filteredGurus.length === 0) return (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span>Tidak ada data guru ditemukan</span>
                    </div>
                  </td>
                </tr>
              )

              return currentData.map((g, index) => {
                const idx = (page - 1) * itemsPerPage + index
                let kelasList: string[] = []
                try { kelasList = JSON.parse(g.kelas || '[]') } catch {}
                
                return (
                  <tr key={g.id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, color: '#1e3a8a',
                        }}>
                          {g.user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{g.user.name}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '2px' }}>{g.user.email}</div>
                      {g.nip && <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>NIP: {g.nip}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {kelasList.length > 0 ? kelasList.map(k => (
                          <span key={k} style={{ padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{k}</span>
                        )) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', background: '#f1f5f9', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        {g.setorans?.length || 0}×
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button title="Edit" onClick={() => setShowEdit(g)} style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#dbeafe', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', transition: 'all 0.15s' }} onMouseOver={e => (e.currentTarget.style.background = '#bfdbfe')} onMouseOut={e => (e.currentTarget.style.background = '#dbeafe')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button title="Hapus" onClick={() => setShowDelete(g)} style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', transition: 'all 0.15s' }} onMouseOver={e => (e.currentTarget.style.background = '#fecaca')} onMouseOut={e => (e.currentTarget.style.background = '#fee2e2')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            })()}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {(() => {
        const filteredGurus = gurus.filter(g => 
          g.user.name.toLowerCase().includes(search.toLowerCase()) || 
          g.user.email.toLowerCase().includes(search.toLowerCase()) ||
          (g.nip && g.nip.toLowerCase().includes(search.toLowerCase()))
        )
        const totalPages = Math.ceil(filteredGurus.length / itemsPerPage)
        if (filteredGurus.length === 0 || totalPages <= 1) return null

        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 8px' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Menampilkan <span style={{ fontWeight: 600, color: '#1e293b' }}>{(page - 1) * itemsPerPage + 1}</span> - <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(page * itemsPerPage, filteredGurus.length)}</span> dari <span style={{ fontWeight: 600, color: '#1e293b' }}>{filteredGurus.length}</span> guru
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
        )
      })()}

      {/* Toast */}
      {toast && <div className="toast" style={{ background: '#1e3a8a' }}>{toast}</div>}

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Tambah Guru Baru" onClose={() => setShowAdd(false)}>
          <GuruForm initial={EMPTY_FORM} isEdit={false} onSave={handleAdd} onClose={() => setShowAdd(false)} saving={saving} kelasList={kelasList} />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Data Guru" onClose={() => setShowEdit(null)}>
          <GuruForm initial={getEditInitial(showEdit)} isEdit={true} onSave={handleEdit} onClose={() => setShowEdit(null)} saving={saving} kelasList={kelasList} />
        </Modal>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <ConfirmDialog
          message={`Hapus guru "${showDelete.user.name}"? Akun login guru ini juga akan dihapus. Pastikan guru tidak memiliki data setoran aktif.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
