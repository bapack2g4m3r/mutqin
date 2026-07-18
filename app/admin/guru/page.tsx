'use client'
import { useState, useEffect, useCallback } from 'react'

interface Guru {
  id: string; nip?: string; kelas: string
  user: { id: string; name: string; email: string }
  setorans: { id: string }[]
}

const KELAS_LIST = ['7A','7B','7C','7D','8A','8B','8C','8D','9A','9B','9C','9D']
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

function GuruForm({ initial, isEdit, onSave, onClose, saving }: {
  initial: { nama: string; email: string; password: string; nip: string; kelas: string[] }
  isEdit: boolean
  onSave: (data: typeof initial) => void
  onClose: () => void
  saving: boolean
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
          {KELAS_LIST.map(k => {
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
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit]   = useState<Guru | null>(null)
  const [showDelete, setShowDelete] = useState<Guru | null>(null)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast]     = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/guru').then(r => r.json()).then(d => setGurus(d.gurus || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

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

      {/* Guru Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }} className="stagger-children">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ height: '160px' }}>
              <div className="skeleton" style={{ height: '16px', width: '40%', borderRadius: '6px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '12px', width: '60%', borderRadius: '6px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '12px', width: '30%', borderRadius: '6px' }} />
            </div>
          ))
        ) : gurus.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }} className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <p>Belum ada guru terdaftar</p>
          </div>
        ) : (
          gurus.map(g => {
            let kelasList: string[] = []
            try { kelasList = JSON.parse(g.kelas || '[]') } catch {}
            return (
              <div key={g.id} className="card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '17px', fontWeight: 700, color: '#1e3a8a',
                  }}>
                    {g.user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.user.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.user.email}
                    </div>
                    {g.nip && <div style={{ fontSize: '12px', color: '#94a3b8' }}>NIP: {g.nip}</div>}
                  </div>
                </div>

                {/* Kelas badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '14px 0' }}>
                  {kelasList.length > 0 ? kelasList.map(k => (
                    <span key={k} style={{ padding: '2px 10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>{k}</span>
                  )) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Belum ada kelas</span>
                  )}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{g.setorans?.length || 0}</span> setoran dicatat
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button id={`btn-edit-guru-${g.id}`} title="Edit" onClick={() => setShowEdit(g)}
                      style={{ padding: '6px 14px', borderRadius: '10px', background: '#dbeafe', color: '#1d4ed8', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      onMouseOver={e => (e.currentTarget.style.background = '#bfdbfe')}
                      onMouseOut={e => (e.currentTarget.style.background = '#dbeafe')}>
                      ✏️ Edit
                    </button>
                    <button id={`btn-delete-guru-${g.id}`} title="Hapus" onClick={() => setShowDelete(g)}
                      style={{ padding: '6px 14px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      onMouseOver={e => (e.currentTarget.style.background = '#fecaca')}
                      onMouseOut={e => (e.currentTarget.style.background = '#fee2e2')}>
                      🗑 Hapus
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Toast */}
      {toast && <div className="toast" style={{ background: '#1e3a8a' }}>{toast}</div>}

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Tambah Guru Baru" onClose={() => setShowAdd(false)}>
          <GuruForm initial={EMPTY_FORM} isEdit={false} onSave={handleAdd} onClose={() => setShowAdd(false)} saving={saving} />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Data Guru" onClose={() => setShowEdit(null)}>
          <GuruForm initial={getEditInitial(showEdit)} isEdit={true} onSave={handleEdit} onClose={() => setShowEdit(null)} saving={saving} />
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
