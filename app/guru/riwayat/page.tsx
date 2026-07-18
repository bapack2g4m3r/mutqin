'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileNav from '@/components/layout/MobileNav'

interface Setoran {
  id: string
  jenis: string
  surah?: string
  nilaiAkhir: number
  predikat: string
  catatan?: string
  isTasmi: boolean
  tanggal: string
  siswa: { id: string; nama: string; kelas: string }
  guru: { user: { name: string } }
}

function PredikatBadge({ predikat }: { predikat: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    MUMTAZ:        { label: 'Mumtaz',        cls: 'badge-mumtaz' },
    JAYYID_JIDDAN: { label: 'Jayyid Jiddan', cls: 'badge-jayyidj' },
    JAYYID:        { label: 'Jayyid',         cls: 'badge-jayyid' },
    GHAIR_MAQBUL:  { label: 'Ghair Maqbul',   cls: 'badge-ghair' },
  }
  const p = map[predikat] || { label: predikat, cls: 'badge-jayyid' }
  return <span className={`badge ${p.cls}`}>{p.label}</span>
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function RiwayatPage() {
  const router = useRouter()
  const [setorans, setSetorans] = useState<Setoran[]>([])
  const [loading, setLoading] = useState(true)
  const [jenis, setJenis] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (jenis) params.set('jenis', jenis)
    fetch(`/api/setoran?${params}`)
      .then(r => r.json())
      .then(d => setSetorans(d.setorans || []))
      .finally(() => setLoading(false))
  }, [jenis])

  const filtered = search
    ? setorans.filter(s => s.siswa.nama.toLowerCase().includes(search.toLowerCase()))
    : setorans

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <header className="mobile-header" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Riwayat Setoran</h1>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{filtered.length} setoran</span>
      </header>

      <div className="page-mobile">
        <div className="search-bar" style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="input-icon-wrap">
            <span className="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input id="search-riwayat" type="search" className="input" placeholder="Cari nama siswa..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs">
            <button id="filter-semua" className={`tab ${!jenis ? 'active' : ''}`} onClick={() => setJenis('')}>Semua</button>
            <button id="filter-tahfidz" className={`tab ${jenis === 'TAHFIDZ' ? 'active' : ''}`} onClick={() => setJenis('TAHFIDZ')}>📖 Tahfidz</button>
            <button id="filter-tahsin" className={`tab ${jenis === 'TAHSIN' ? 'active' : ''}`} onClick={() => setJenis('TAHSIN')}>🗣 Tahsin</button>
          </div>
        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '14px', height: '80px' }}>
                <div className="skeleton" style={{ height: '14px', width: '50%', borderRadius: '6px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '30%', borderRadius: '6px' }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p>Belum ada riwayat setoran</p>
            </div>
          ) : (
            filtered.map(s => (
              <button
                key={s.id}
                className="list-item"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => router.push(`/guru/siswa/${s.siswa.id}`)}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                  background: s.jenis === 'TAHFIDZ' ? '#dbeafe' : '#fef3c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  {s.jenis === 'TAHFIDZ' ? '📖' : '🗣'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.siswa.nama}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Kelas {s.siswa.kelas} · {s.surah || (s.jenis === 'TAHSIN' ? 'Tahsin' : '')} · {formatDate(s.tanggal)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '20px', fontWeight: 800,
                    color: s.nilaiAkhir >= 90 ? '#059669' : s.nilaiAkhir >= 80 ? '#2563eb' : s.nilaiAkhir >= 70 ? '#d97706' : '#dc2626',
                  }}>
                    {Math.round(s.nilaiAkhir)}
                  </div>
                  <PredikatBadge predikat={s.predikat} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <MobileNav role="guru" />
    </div>
  )
}
