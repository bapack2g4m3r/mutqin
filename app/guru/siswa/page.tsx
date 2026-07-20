'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MobileNav from '@/components/layout/MobileNav'

interface Siswa {
  id: string
  nis: string
  nama: string
  kelas: string
  setorans: Array<{ nilaiAkhir: number; jenis: string; tanggal: string; predikat: string }>
}

function getInitials(nama: string) {
  return nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
}

export default function GuruSiswaPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [kelas, setKelas] = useState('')
  const [kelasList, setKelasList] = useState<string[]>(['Semua'])
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

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
        setKelasList(['Semua', ...classes.sort((a: any, b: any) => a.nama.localeCompare(b.nama)).map((k: any) => k.nama)])
      }
    } catch(e) {}
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (kelas) params.set('kelas', kelas)
    params.set('limit', '100')
    fetch(`/api/siswa?${params}`)
      .then(r => r.json())
      .then(d => setSiswa(d.siswa || []))
      .finally(() => setLoading(false))
  }, [debouncedSearch, kelas])

  useEffect(() => { fetchKelas() }, [fetchKelas])

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header className="mobile-header">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a', padding: '4px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ flex: 1, fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Cari Siswa</h1>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{siswa.length} siswa</span>
      </header>

      <div className="page-mobile">
        {/* Search */}
        <div className="search-bar" style={{ paddingTop: '12px' }}>
          <div className="input-icon-wrap">
            <span className="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              id="search-siswa"
              type="search"
              className="input"
              placeholder="Cari nama atau NIS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Kelas filter */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginTop: '10px', scrollbarWidth: 'none' }}>
            {kelasList.map(k => (
              <button
                key={k}
                id={`filter-kelas-${k.replace(' ', '')}`}
                onClick={() => setKelas(k === 'Semua' ? '' : k)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: (k === 'Semua' ? !kelas : kelas === k) ? '#1e3a8a' : '#e2e8f0',
                  color: (k === 'Semua' ? !kelas : kelas === k) ? 'white' : '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }} className="stagger-children">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '14px', width: '55%', marginBottom: '8px', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '35%', borderRadius: '6px' }} />
                </div>
              </div>
            ))
          ) : siswa.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              <p>Siswa tidak ditemukan</p>
            </div>
          ) : (
            siswa.map(s => (
              <button
                key={s.id}
                id={`siswa-${s.id}`}
                className="list-item"
                onClick={() => router.push(`/guru/siswa/${s.id}`)}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <div className="avatar-placeholder avatar-md">
                  {getInitials(s.nama)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b' }}>{s.nama}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>NIS {s.nis} · Kelas {s.kelas}</div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {s.setorans.length > 0 ? (
                    <span style={{
                      fontSize: '11px',
                      color: '#64748b',
                      background: '#f1f5f9',
                      padding: '3px 8px',
                      borderRadius: '8px',
                    }}>
                      {s.setorans.length}×
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Belum setor</span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ display: 'block', marginTop: '4px' }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
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
