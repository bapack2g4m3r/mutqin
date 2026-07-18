'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Setoran {
  id: string; jenis: string; surah?: string; nilaiAkhir: number; predikat: string
  tanggal: string; isTasmi: boolean; catatan?: string
  siswa: { nama: string; kelas: string; nis: string }
  guru: { user: { name: string } }
}

const KELAS_LIST = ['7A','7B','7C','8A','8B','8C','9A','9B','9C']

function PredikatBadge({ p }: { p: string }) {
  const cls = p === 'MUMTAZ' ? 'badge-mumtaz' : p === 'JAYYID_JIDDAN' ? 'badge-jayyidj' : p === 'JAYYID' ? 'badge-jayyid' : 'badge-ghair'
  const label = p === 'MUMTAZ' ? 'Mumtaz' : p === 'JAYYID_JIDDAN' ? 'Jayyid Jiddan' : p === 'JAYYID' ? 'Jayyid' : 'Ghair Maqbul'
  return <span className={`badge ${cls}`}>{label}</span>
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminSetoranPage() {
  const [setorans, setSetorans] = useState<Setoran[]>([])
  const [loading, setLoading] = useState(true)
  const [jenis, setJenis] = useState('')
  const [kelas, setKelas] = useState('')

  function load() {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (jenis) params.set('jenis', jenis)
    if (kelas) params.set('kelas', kelas)
    fetch(`/api/setoran?${params}`).then(r => r.json()).then(d => setSetorans(d.setorans || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [jenis, kelas])

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Semua Setoran</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>{setorans.length} setoran</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select id="filter-setoran-jenis" className="input" value={jenis} onChange={e => setJenis(e.target.value)} style={{ width: '160px' }}>
          <option value="">Semua Jenis</option>
          <option value="TAHFIDZ">📖 Tahfidz</option>
          <option value="TAHSIN">🗣 Tahsin</option>
        </select>
        <select id="filter-setoran-kelas" className="input" value={kelas} onChange={e => setKelas(e.target.value)} style={{ width: '140px' }}>
          <option value="">Semua Kelas</option>
          {KELAS_LIST.map(k => <option key={k}>{k}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Siswa</th><th>Kelas</th><th>Jenis</th>
              <th>Surah</th><th>Nilai</th><th>Predikat</th><th>Guru</th><th>Tasmi&apos;</th><th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 10 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} /></td>
                ))}</tr>
              ))
            ) : setorans.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Tidak ada data setoran</td></tr>
            ) : (
              setorans.map((s, idx) => (
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
                  <td style={{ fontSize: '13px', color: '#64748b' }}>{s.surah || '—'}</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
