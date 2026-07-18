'use client'
import { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Semester {
  id: string; nama: string; isAktif: boolean
  tanggalMulai: string | null; tanggalAkhir: string | null
  _count?: { setorans: number }
}
interface Kelas {
  id: string; nama: string; tingkat: number; jumlahSiswa: number
  waliKelasId: string | null
  waliKelas?: { user: { name: string } } | null
}
interface TahunAjaran {
  id: string; nama: string; isAktif: boolean
  semesters: Semester[]
  kelas: Kelas[]
}
interface Guru {
  id: string; user: { name: string }
}
interface AkademikData {
  tahunAjaranList: TahunAjaran[]
  aktivSemester: (Semester & { tahunAjaran: { nama: string } }) | null
  allGuru: Guru[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Reusable Modal ───────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(6px)', padding: '16px',
    }}>
      <div className="animate-scaleIn" style={{
        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: subtitle ? '2px' : 0 }}>{title}</h3>
              {subtitle && <p style={{ fontSize: '13px', color: '#64748b' }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{
              background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b',
              padding: '8px', borderRadius: '10px', flexShrink: 0, marginLeft: '12px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{ padding: '20px 28px 28px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

function ConfirmDelete({ label, onConfirm, onCancel, loading }: {
  label: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, backdropFilter: 'blur(6px)', padding: '16px',
    }}>
      <div className="animate-scaleIn" style={{
        background: 'white', borderRadius: '20px', padding: '28px',
        width: '100%', maxWidth: '360px', textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </div>
        <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Hapus {label}?</h4>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Tindakan ini tidak dapat dibatalkan.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>Batal</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} disabled={loading}>
            {loading ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Active Badge ─────────────────────────────────────────────────────────────
function ActiveBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      background: '#d1fae5', color: '#059669', fontSize: '11px', fontWeight: 700,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
      AKTIF
    </span>
  )
}

// ─── Section Card wrapper ─────────────────────────────────────────────────────
function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'white', borderRadius: '20px', padding: '24px',
      boxShadow: '0 2px 16px rgba(30,58,138,0.06)',
      border: '1px solid rgba(30,58,138,0.06)', ...style,
    }}>
      {children}
    </div>
  )
}

// ─── TAHUN AJARAN section ─────────────────────────────────────────────────────
function TahunAjaranSection({ data, allTa, onRefresh, showToast }: {
  data: TahunAjaran[]; allTa: TahunAjaran[]; onRefresh: () => void; showToast: (m: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [newNama, setNewNama] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd() {
    setSaving(true)
    try {
      const res = await fetch('/api/akademik/tahun-ajaran', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: newNama }),
      })
      const d = await res.json()
      if (!res.ok) { alert(d.error); return }
      showToast('✓ Tahun ajaran berhasil ditambahkan')
      setShowAdd(false); setNewNama(''); onRefresh()
    } finally { setSaving(false) }
  }

  async function handleActivate(id: string) {
    const res = await fetch(`/api/akademik/tahun-ajaran/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setAktif: true }),
    })
    if (res.ok) { showToast('✓ Tahun ajaran diaktifkan'); onRefresh() }
    else { const d = await res.json(); alert(d.error) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/akademik/tahun-ajaran/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('✓ Tahun ajaran dihapus'); onRefresh() }
    else { const d = await res.json(); alert(d.error) }
    setDeleting(null)
  }

  return (
    <SectionCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Tahun Ajaran</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{data.length} tahun ajaran</p>
        </div>
        <button id="btn-add-ta" className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Tambah</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map(ta => (
          <div key={ta.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: '14px',
            background: ta.isAktif ? '#f0f9ff' : '#f8fafc',
            border: `1.5px solid ${ta.isAktif ? '#bae6fd' : '#f1f5f9'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                background: ta.isAktif ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ta.isAktif ? 'white' : '#94a3b8'} strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{ta.nama}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {ta.semesters.length} semester · {ta.kelas.length} kelas
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {ta.isAktif ? <ActiveBadge /> : (
                <button id={`btn-aktif-ta-${ta.id}`}
                  onClick={() => handleActivate(ta.id)}
                  style={{ padding: '5px 12px', borderRadius: '10px', background: '#dbeafe', color: '#1d4ed8', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  Aktifkan
                </button>
              )}
              {!ta.isAktif && (
                <button id={`btn-del-ta-${ta.id}`} onClick={() => setDeleting(ta.id)}
                  style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Tambah Tahun Ajaran" subtitle="Format: YYYY/YYYY, contoh 2026/2027" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Tahun Ajaran</label>
              <input id="input-ta-nama" type="text" className="input" placeholder="2026/2027"
                value={newNama} onChange={e => setNewNama(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Batal</button>
              <button id="btn-save-ta" className="btn btn-primary" style={{ flex: 1 }}
                onClick={handleAdd} disabled={saving || !newNama}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDelete label="Tahun Ajaran" loading={false}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)} />
      )}
    </SectionCard>
  )
}

// ─── SEMESTER section ─────────────────────────────────────────────────────────
function SemesterSection({ data, allTa, onRefresh, showToast }: {
  data: TahunAjaran[]; allTa: TahunAjaran[]; onRefresh: () => void; showToast: (m: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nama: 'Ganjil', tahunAjaranId: '', tanggalMulai: '', tanggalAkhir: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editDate, setEditDate] = useState<Semester | null>(null)
  const [dateForm, setDateForm] = useState({ tanggalMulai: '', tanggalAkhir: '' })

  const allSemesters = data.flatMap(ta => ta.semesters.map(s => ({ ...s, tahunAjaran: ta })))

  async function handleAdd() {
    setSaving(true)
    try {
      const res = await fetch('/api/akademik/semester', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { alert(d.error); return }
      showToast('✓ Semester berhasil ditambahkan')
      setShowAdd(false); onRefresh()
    } finally { setSaving(false) }
  }

  async function handleActivate(id: string) {
    const res = await fetch(`/api/akademik/semester/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setAktif: true }),
    })
    if (res.ok) { showToast('✓ Semester diaktifkan'); onRefresh() }
    else { const d = await res.json(); alert(d.error) }
  }

  async function handleSaveDate() {
    if (!editDate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/akademik/semester/${editDate.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateForm),
      })
      if (res.ok) { showToast('✓ Tanggal semester diperbarui'); setEditDate(null); onRefresh() }
      else { const d = await res.json(); alert(d.error) }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/akademik/semester/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('✓ Semester dihapus'); onRefresh() }
    else { const d = await res.json(); alert(d.error) }
    setDeleting(null)
  }

  return (
    <SectionCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Semester</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{allSemesters.length} semester</p>
        </div>
        <button id="btn-add-semester" className="btn btn-primary btn-sm" onClick={() => { setShowAdd(true); setForm(p => ({ ...p, tahunAjaranId: data.find(x => x.isAktif)?.id || data[0]?.id || '' })) }}>+ Tambah</button>
      </div>

      {/* Group by Tahun Ajaran */}
      {data.map(ta => ta.semesters.length > 0 && (
        <div key={ta.id} style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {ta.nama}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ta.semesters.map(sem => (
              <div key={sem.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: '14px',
                background: sem.isAktif ? '#f0f9ff' : '#f8fafc',
                border: `1.5px solid ${sem.isAktif ? '#bae6fd' : '#f1f5f9'}`,
                flexWrap: 'wrap', gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                    background: sem.nama === 'Ganjil'
                      ? (sem.isAktif ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#dbeafe')
                      : (sem.isAktif ? 'linear-gradient(135deg, #b45309, #d97706)' : '#fef3c7'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                  }}>
                    {sem.nama === 'Ganjil' ? '🌙' : '☀️'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                      Semester {sem.nama}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {fmtDate(sem.tanggalMulai)} — {fmtDate(sem.tanggalAkhir)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {sem.isAktif ? <ActiveBadge /> : (
                    <button id={`btn-aktif-sem-${sem.id}`} onClick={() => handleActivate(sem.id)}
                      style={{ padding: '5px 12px', borderRadius: '10px', background: '#dbeafe', color: '#1d4ed8', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      Aktifkan
                    </button>
                  )}
                  <button id={`btn-edit-date-${sem.id}`} onClick={() => { setEditDate(sem); setDateForm({ tanggalMulai: sem.tanggalMulai?.split('T')[0] || '', tanggalAkhir: sem.tanggalAkhir?.split('T')[0] || '' }) }}
                    style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  {!sem.isAktif && (
                    <button id={`btn-del-sem-${sem.id}`} onClick={() => setDeleting(sem.id)}
                      style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Semester Modal */}
      {showAdd && (
        <Modal title="Tambah Semester" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Tahun Ajaran</label>
              <select className="input" value={form.tahunAjaranId} onChange={e => setForm(p => ({ ...p, tahunAjaranId: e.target.value }))}>
                {data.map(ta => <option key={ta.id} value={ta.id}>{ta.nama}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Nama Semester</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['Ganjil', 'Genap'].map(n => (
                  <button key={n} type="button" onClick={() => setForm(p => ({ ...p, nama: n }))}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `1.5px solid ${form.nama === n ? '#1d4ed8' : '#e2e8f0'}`, background: form.nama === n ? '#dbeafe' : 'white', color: form.nama === n ? '#1d4ed8' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                    {n === 'Ganjil' ? '🌙' : '☀️'} {n}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Mulai</label>
                <input type="date" className="input" value={form.tanggalMulai} onChange={e => setForm(p => ({ ...p, tanggalMulai: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Akhir</label>
                <input type="date" className="input" value={form.tanggalAkhir} onChange={e => setForm(p => ({ ...p, tanggalAkhir: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Batal</button>
              <button id="btn-save-semester" className="btn btn-primary" style={{ flex: 1 }}
                onClick={handleAdd} disabled={saving || !form.tahunAjaranId}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Date Modal */}
      {editDate && (
        <Modal title={`Edit Tanggal — Semester ${editDate.nama}`} onClose={() => setEditDate(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Tanggal Mulai</label>
                <input type="date" className="input" value={dateForm.tanggalMulai} onChange={e => setDateForm(p => ({ ...p, tanggalMulai: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Tanggal Akhir</label>
                <input type="date" className="input" value={dateForm.tanggalAkhir} onChange={e => setDateForm(p => ({ ...p, tanggalAkhir: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditDate(null)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveDate} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDelete label="Semester" loading={false}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)} />
      )}
    </SectionCard>
  )
}

// ─── KELAS section ────────────────────────────────────────────────────────────
function KelasSection({ data, allGuru, onRefresh, showToast }: {
  data: TahunAjaran[]; allGuru: Guru[]; onRefresh: () => void; showToast: (m: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ nama: '', tingkat: '7', tahunAjaranId: '', waliKelasId: '' })
  const [saving, setSaving] = useState(false)
  const [editKelas, setEditKelas] = useState<Kelas | null>(null)
  const [editForm, setEditForm] = useState({ waliKelasId: '' })
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeTaId, setActiveTaId] = useState(data.find(x => x.isAktif)?.id || data[0]?.id || '')

  const currentTa = data.find(x => x.id === activeTaId)

  // Group kelas by tingkat
  const grouped = [7, 8, 9].map(t => ({
    tingkat: t,
    kelas: (currentTa?.kelas || []).filter(k => k.tingkat === t).sort((a, b) => a.nama.localeCompare(b.nama)),
  }))

  async function handleAdd() {
    setSaving(true)
    try {
      const res = await fetch('/api/akademik/kelas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, tingkat: Number(addForm.tingkat), tahunAjaranId: activeTaId }),
      })
      const d = await res.json()
      if (!res.ok) { alert(d.error); return }
      showToast(`✓ Kelas ${addForm.nama} berhasil ditambahkan`)
      setShowAdd(false); setAddForm({ nama: '', tingkat: '7', tahunAjaranId: '', waliKelasId: '' }); onRefresh()
    } finally { setSaving(false) }
  }

  async function handleEditWali() {
    if (!editKelas) return
    setSaving(true)
    try {
      const res = await fetch(`/api/akademik/kelas/${editKelas.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waliKelasId: editForm.waliKelasId || null }),
      })
      if (res.ok) { showToast('✓ Wali kelas diperbarui'); setEditKelas(null); onRefresh() }
      else { const d = await res.json(); alert(d.error) }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/akademik/kelas/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('✓ Kelas dihapus'); onRefresh() }
    else { const d = await res.json(); alert(d.error) }
    setDeleting(null)
  }

  async function handleSyncSiswa(id: string, kelasNama: string) {
    const res = await fetch(`/api/akademik/kelas/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (res.ok) { showToast('✓ Jumlah siswa disinkronkan'); onRefresh() }
  }

  const TINGKAT_LABELS: Record<number, string> = { 7: 'Kelas 7', 8: 'Kelas 8', 9: 'Kelas 9' }
  const TINGKAT_COLORS: Record<number, { bg: string; color: string }> = {
    7: { bg: '#dbeafe', color: '#1d4ed8' },
    8: { bg: '#d1fae5', color: '#059669' },
    9: { bg: '#fef3c7', color: '#d97706' },
  }

  return (
    <SectionCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Struktur Kelas</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{currentTa?.kelas.length || 0} kelas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Tahun Ajaran Tabs */}
          {data.map(ta => (
            <button key={ta.id} onClick={() => setActiveTaId(ta.id)}
              style={{
                padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                border: `1.5px solid ${activeTaId === ta.id ? '#1d4ed8' : '#e2e8f0'}`,
                background: activeTaId === ta.id ? '#dbeafe' : 'white',
                color: activeTaId === ta.id ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
              }}>
              {ta.nama}
            </button>
          ))}
          <button id="btn-add-kelas" className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Tambah</button>
        </div>
      </div>

      {/* Kelas Grid by Tingkat */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {grouped.map(g => g.kelas.length > 0 && (
          <div key={g.tingkat}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {TINGKAT_LABELS[g.tingkat]}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {g.kelas.map(k => {
                const colors = TINGKAT_COLORS[k.tingkat]
                return (
                  <div key={k.id} style={{
                    padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9',
                    background: 'white', boxShadow: '0 2px 8px rgba(30,58,138,0.04)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '10px', fontSize: '16px', fontWeight: 800, ...colors }}>
                        {k.nama}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button id={`btn-edit-kelas-${k.id}`} onClick={() => { setEditKelas(k); setEditForm({ waliKelasId: k.waliKelasId || '' }) }}
                          style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button id={`btn-del-kelas-${k.id}`} onClick={() => setDeleting(k.id)}
                          style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{k.jumlahSiswa}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>siswa</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {k.waliKelas
                          ? <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>👤 {k.waliKelas.user.name.split(' ')[0]}</div>
                          : <div style={{ fontSize: '11px', color: '#94a3b8' }}>— Belum ada wali</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {(currentTa?.kelas.length || 0) === 0 && (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>Belum ada kelas untuk tahun ajaran ini</p>
          </div>
        )}
      </div>

      {/* Add Kelas Modal */}
      {showAdd && (
        <Modal title="Tambah Kelas" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Nama Kelas</label>
                <input id="input-kelas-nama" type="text" className="input" placeholder="contoh: 7D"
                  value={addForm.nama} onChange={e => setAddForm(p => ({ ...p, nama: e.target.value.toUpperCase() }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Tingkat</label>
                <select className="input" value={addForm.tingkat} onChange={e => setAddForm(p => ({ ...p, tingkat: e.target.value }))}>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Wali Kelas (Opsional)</label>
              <select className="input" value={addForm.waliKelasId} onChange={e => setAddForm(p => ({ ...p, waliKelasId: e.target.value }))}>
                <option value="">— Belum ditentukan —</option>
                {allGuru.map(g => <option key={g.id} value={g.id}>{g.user.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Batal</button>
              <button id="btn-save-kelas" className="btn btn-primary" style={{ flex: 1 }}
                onClick={handleAdd} disabled={saving || !addForm.nama || !addForm.tingkat}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Wali Kelas Modal */}
      {editKelas && (
        <Modal title={`Atur Wali Kelas — ${editKelas.nama}`} onClose={() => setEditKelas(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Wali Kelas</label>
              <select className="input" value={editForm.waliKelasId} onChange={e => setEditForm(p => ({ ...p, waliKelasId: e.target.value }))}>
                <option value="">— Belum ditentukan —</option>
                {allGuru.map(g => <option key={g.id} value={g.id}>{g.user.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditKelas(null)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleEditWali} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDelete label="Kelas" loading={false}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)} />
      )}
    </SectionCard>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AkademikPage() {
  const [data, setData] = useState<AkademikData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/akademik').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading || !data) {
    return (
      <div style={{ padding: '32px', maxWidth: '1100px' }}>
        <div className="skeleton" style={{ height: '32px', width: '220px', borderRadius: '8px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '16px', width: '300px', borderRadius: '6px', marginBottom: '32px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '20px' }} />)}
        </div>
      </div>
    )
  }

  const { tahunAjaranList, aktivSemester, allGuru } = data

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Struktur Akademik</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Konfigurasi Tahun Ajaran, Semester, dan Kelas sebagai fondasi sistem
        </p>
      </div>

      {/* Active Status Banner */}
      {aktivSemester && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          borderRadius: '20px', padding: '18px 24px',
          display: 'flex', alignItems: 'center', gap: '16px',
          marginBottom: '28px', flexWrap: 'wrap',
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
            📚
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginBottom: '2px' }}>SEDANG BERJALAN</div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
              TA {aktivSemester.tahunAjaran.nama} · Semester {aktivSemester.nama}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>
              {fmtDate(aktivSemester.tanggalMulai)} — {fmtDate(aktivSemester.tanggalAkhir)}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>
              {tahunAjaranList.find(t => t.isAktif)?.kelas.length || 0}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Kelas Aktif</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>
              {tahunAjaranList.find(t => t.isAktif)?.kelas.reduce((a, k) => a + k.jumlahSiswa, 0) || 0}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Total Siswa</div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <TahunAjaranSection data={tahunAjaranList} allTa={tahunAjaranList} onRefresh={load} showToast={showToast} />
          <SemesterSection data={tahunAjaranList} allTa={tahunAjaranList} onRefresh={load} showToast={showToast} />
        </div>

        {/* Right column — Kelas */}
        <KelasSection data={tahunAjaranList} allGuru={allGuru} onRefresh={load} showToast={showToast} />
      </div>

      {/* Toast */}
      {toast && <div className="toast" style={{ background: '#1e3a8a' }}>{toast}</div>}
    </div>
  )
}
