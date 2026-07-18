'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Siswa {
  id: string; nis: string; nama: string; kelas: string
  ortu?: { user: { name: string; email: string } }
  setorans: Array<{ jenis: string; nilaiAkhir: number }>
}

interface BulkRow { nis: string; nama: string; kelas: string; _valid?: boolean; _error?: string }

const KELAS_LIST = ['7A','7B','7C','7D','8A','8B','8C','8D','9A','9B','9C','9D']
const EMPTY_FORM = { nis: '', nama: '', kelas: '7A' }

// ─── Sub-components ──────────────────────────────────────────────────────────

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
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '8px' }}
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
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
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

function SiswaForm({ initial, onSave, onClose, saving }: {
  initial: { nis: string; nama: string; kelas: string }
  onSave: (data: typeof initial) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="input-group">
        <label className="input-label">NIS <span style={{ color: '#dc2626' }}>*</span></label>
        <input id="form-nis" type="text" className="input" placeholder="Contoh: 25091" value={form.nis}
          onChange={e => setForm(p => ({ ...p, nis: e.target.value }))} />
      </div>
      <div className="input-group">
        <label className="input-label">Nama Lengkap <span style={{ color: '#dc2626' }}>*</span></label>
        <input id="form-nama" type="text" className="input" placeholder="Nama siswa" value={form.nama}
          onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} />
      </div>
      <div className="input-group">
        <label className="input-label">Kelas <span style={{ color: '#dc2626' }}>*</span></label>
        <select id="form-kelas" className="input" value={form.kelas}
          onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))}>
          {KELAS_LIST.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Batal</button>
        <button id="btn-save-siswa" className="btn btn-primary" style={{ flex: 1 }}
          onClick={() => onSave(form)} disabled={saving || !form.nis || !form.nama}>
          {saving ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Menyimpan...</> : 'Simpan'}
        </button>
      </div>
    </div>
  )
}

// ─── Bulk Upload Component ────────────────────────────────────────────────────

function BulkUploadPanel({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<BulkRow[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; skippedNis: string[] } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parseError, setParseError] = useState('')

  function downloadTemplate() {
    const csv = 'NIS,Nama,Kelas\n25091,Ahmad Fauzan,7A\n25092,Siti Aisyah,7B\n25093,Muhammad Ali,8A'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template-import-siswa.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function parseCSV(text: string) {
    setParseError('')
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) { setParseError('File kosong atau hanya berisi header.'); return }
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const nisIdx  = header.findIndex(h => h === 'nis')
    const namaIdx = header.findIndex(h => h === 'nama')
    const kelasIdx= header.findIndex(h => h === 'kelas')
    if (nisIdx < 0 || namaIdx < 0 || kelasIdx < 0) {
      setParseError('Header CSV harus mengandung kolom: NIS, Nama, Kelas'); return
    }
    const parsed: BulkRow[] = []
    lines.slice(1).forEach((line, i) => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const nis = cols[nisIdx] || ''; const nama = cols[namaIdx] || ''; const kelas = (cols[kelasIdx] || '').toUpperCase()
      let _error = ''
      if (!nis) _error = 'NIS kosong'
      else if (!nama) _error = 'Nama kosong'
      else if (!KELAS_LIST.includes(kelas)) _error = `Kelas "${kelas}" tidak valid`
      parsed.push({ nis, nama, kelas, _valid: !_error, _error })
    })
    if (parsed.length === 0) { setParseError('Tidak ada data ditemukan.'); return }
    setRows(parsed); setStep('preview')
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) { setParseError('Hanya file .csv yang diterima.'); return }
    const reader = new FileReader()
    reader.onload = e => parseCSV(e.target?.result as string)
    reader.readAsText(file)
  }

  async function handleImport() {
    const validRows = rows.filter(r => r._valid)
    if (!validRows.length) return
    setImporting(true)
    try {
      const res = await fetch('/api/siswa/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Gagal import'); return }
      setResult(data); setStep('result')
    } finally { setImporting(false) }
  }

  const validCount = rows.filter(r => r._valid).length
  const invalidCount = rows.filter(r => !r._valid).length

  return (
    <div>
      {step === 'upload' && (
        <div>
          {/* Template Download */}
          <div style={{
            background: '#f0f9ff', borderRadius: '14px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
            border: '1px solid #bae6fd',
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Download Template CSV</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Format: NIS, Nama, Kelas (contoh: 7A, 8B, 9C)</div>
            </div>
            <button id="btn-download-template" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={downloadTemplate}>
              Download
            </button>
          </div>

          {/* Drop Zone */}
          <div
            id="drop-zone-csv"
            style={{
              border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
              borderRadius: '16px', padding: '48px 24px',
              textAlign: 'center', cursor: 'pointer',
              background: dragOver ? '#eff6ff' : '#fafafa',
              transition: 'all 0.2s ease',
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: dragOver ? '#dbeafe' : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', transition: 'all 0.2s',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? '#2563eb' : '#94a3b8'} strokeWidth="2">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: dragOver ? '#2563eb' : '#1e293b', marginBottom: '4px' }}>
              {dragOver ? 'Lepas file di sini' : 'Klik atau drag & drop file CSV'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Format: .csv · Maks. 500 baris</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

          {parseError && (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {parseError}
            </div>
          )}
        </div>
      )}

      {step === 'preview' && (
        <div>
          {/* Summary chips */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px 14px', background: '#d1fae5', borderRadius: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ color: '#059669', fontWeight: 700, fontSize: '15px' }}>{validCount}</span>
              <span style={{ color: '#065f46', fontSize: '12px' }}>siap diimport</span>
            </div>
            {invalidCount > 0 && (
              <div style={{ padding: '8px 14px', background: '#fee2e2', borderRadius: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '15px' }}>{invalidCount}</span>
                <span style={{ color: '#991b1b', fontSize: '12px' }}>error (akan dilewati)</span>
              </div>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setRows([]); setStep('upload'); setParseError('') }}>
                Ganti File
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>NIS</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Nama</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kelas</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9', background: r._valid ? 'white' : '#fff8f8' }}>
                    <td style={{ padding: '9px 12px', fontSize: '13px', fontFamily: 'monospace', color: '#64748b' }}>{r.nis || '—'}</td>
                    <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: r._valid ? 600 : 400, color: r._valid ? '#1e293b' : '#dc2626' }}>{r.nama || '—'}</td>
                    <td style={{ padding: '9px 12px' }}>
                      {r._valid ? (
                        <span style={{ padding: '2px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{r.kelas}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#dc2626' }}>{r.kelas || '—'}</span>
                      )}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {r._valid
                        ? <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>✓ OK</span>
                        : <span style={{ fontSize: '11px', color: '#dc2626' }}>⚠ {r._error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Batal</button>
            <button id="btn-confirm-import" className="btn btn-primary" style={{ flex: 2 }}
              onClick={handleImport} disabled={importing || validCount === 0}>
              {importing
                ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Mengimport...</>
                : `Import ${validCount} Siswa`}
            </button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div style={{ textAlign: 'center' }}>
          <div className="animate-scaleIn" style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #34d399, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(5,150,105,0.3)',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Import Berhasil!</h4>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ padding: '12px 20px', background: '#d1fae5', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>{result.created}</div>
              <div style={{ fontSize: '12px', color: '#065f46' }}>Siswa ditambahkan</div>
            </div>
            <div style={{ padding: '12px 20px', background: '#fef3c7', borderRadius: '12px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>{result.skipped}</div>
              <div style={{ fontSize: '12px', color: '#92400e' }}>Duplikat dilewati</div>
            </div>
          </div>
          {result.skippedNis.length > 0 && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              NIS yang sudah ada: {result.skippedNis.join(', ')}
            </p>
          )}
          <button id="btn-selesai-import" className="btn btn-primary" style={{ width: '100%' }}
            onClick={() => { onSuccess(); onClose() }}>
            Selesai
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSiswaPage() {
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kelas, setKelas] = useState('')

  // Modals
  const [showAdd, setShowAdd]       = useState(false)
  const [showEdit, setShowEdit]     = useState<Siswa | null>(null)
  const [showDelete, setShowDelete] = useState<Siswa | null>(null)
  const [showBulk, setShowBulk]    = useState(false)

  // Saving/deleting states
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast]     = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams({ limit: '500' })
    if (search) p.set('search', search)
    if (kelas)  p.set('kelas', kelas)
    fetch(`/api/siswa?${p}`).then(r => r.json()).then(d => setSiswa(d.siswa || [])).finally(() => setLoading(false))
  }, [search, kelas])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  async function handleAdd(form: { nis: string; nama: string; kelas: string }) {
    setSaving(true)
    try {
      const res = await fetch('/api/siswa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Gagal menambah siswa'); return }
      showToast(`✓ Siswa "${form.nama}" berhasil ditambahkan`)
      setShowAdd(false); load()
    } finally { setSaving(false) }
  }

  async function handleEdit(form: { nis: string; nama: string; kelas: string }) {
    if (!showEdit) return
    setSaving(true)
    try {
      const res = await fetch(`/api/siswa/${showEdit.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      const res = await fetch(`/api/siswa/${showDelete.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Gagal hapus'); return }
      showToast(`✓ Siswa "${showDelete.nama}" berhasil dihapus`)
      setShowDelete(null); load()
    } finally { setDeleting(false) }
  }

  const avgNilai = (s: Siswa['setorans']) =>
    s.length ? Math.round(s.reduce((a, x) => a + x.nilaiAkhir, 0) / s.length) : null

  return (
    <div style={{ padding: '32px', maxWidth: '1280px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Data Siswa</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{siswa.length} siswa terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button id="btn-bulk-upload" className="btn btn-outline"
            onClick={() => setShowBulk(true)}
            style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            Import CSV
          </button>
          <button id="btn-tambah-siswa" className="btn btn-primary"
            onClick={() => setShowAdd(true)}
            style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: '200px' }}>
          <span className="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input id="search-siswa" type="search" className="input" placeholder="Cari nama atau NIS..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="filter-kelas" className="input" value={kelas}
          onChange={e => setKelas(e.target.value)} style={{ width: '150px' }}>
          <option value="">Semua Kelas</option>
          {KELAS_LIST.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>NIS</th>
              <th>Nama Siswa</th>
              <th>Kelas</th>
              <th>Orang Tua</th>
              <th style={{ textAlign: 'center' }}>Total Setoran</th>
              <th style={{ textAlign: 'center' }}>Rata-rata Nilai</th>
              <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} /></td>
                ))}</tr>
              ))
            ) : siswa.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    <span>Tidak ada siswa ditemukan</span>
                  </div>
                </td>
              </tr>
            ) : (
              siswa.map((s, idx) => {
                const avg = avgNilai(s.setorans)
                return (
                  <tr key={s.id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: '#64748b' }}>{s.nis}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{s.nama}</td>
                    <td>
                      <span style={{ padding: '2px 10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                        {s.kelas}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>{s.ortu?.user.name || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', background: '#f1f5f9', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        {s.setorans.length}×
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {avg !== null
                        ? <span style={{ fontWeight: 700, fontSize: '15px', color: avg >= 90 ? '#059669' : avg >= 80 ? '#2563eb' : avg >= 70 ? '#d97706' : '#dc2626' }}>{avg}</span>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          id={`btn-edit-${s.id}`}
                          title="Edit siswa"
                          onClick={() => setShowEdit(s)}
                          style={{
                            width: '34px', height: '34px', borderRadius: '10px',
                            background: '#dbeafe', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = '#bfdbfe')}
                          onMouseOut={e => (e.currentTarget.style.background = '#dbeafe')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          id={`btn-delete-${s.id}`}
                          title="Hapus siswa"
                          onClick={() => setShowDelete(s)}
                          style={{
                            width: '34px', height: '34px', borderRadius: '10px',
                            background: '#fee2e2', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseOver={e => (e.currentTarget.style.background = '#fecaca')}
                          onMouseOut={e => (e.currentTarget.style.background = '#fee2e2')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ background: '#1e3a8a', bottom: '24px' }}>
          {toast}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Tambah Siswa Baru" onClose={() => setShowAdd(false)}>
          <SiswaForm initial={EMPTY_FORM} onSave={handleAdd} onClose={() => setShowAdd(false)} saving={saving} />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Data Siswa" onClose={() => setShowEdit(null)}>
          <SiswaForm
            initial={{ nis: showEdit.nis, nama: showEdit.nama, kelas: showEdit.kelas }}
            onSave={handleEdit}
            onClose={() => setShowEdit(null)}
            saving={saving}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <ConfirmDialog
          message={`Hapus siswa "${showDelete.nama}"? Semua data setoran terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(null)}
          loading={deleting}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulk && (
        <Modal title="Import Siswa dari CSV" onClose={() => setShowBulk(false)}>
          <BulkUploadPanel onClose={() => setShowBulk(false)} onSuccess={load} />
        </Modal>
      )}
    </div>
  )
}
