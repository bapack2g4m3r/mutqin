'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'
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
  guruId: string
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

export default function GuruRiwayatPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [setorans, setSetorans] = useState<Setoran[]>([])
  const [loading, setLoading] = useState(true)
  const [jenis, setJenis] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    // 1. Instantly load from cache
    const loadCache = async () => {
      try {
        const { get } = await import('idb-keyval')
        const cached = await get('mutqin_cached_setoran_list') as Setoran[] | undefined
        if (cached && Array.isArray(cached)) {
          let list = cached
          if (jenis) list = list.filter(s => s.jenis === jenis)
          if (page === 1) {
            setSetorans(list.slice(0, 50))
            setTotal(list.length)
          }
          setLoading(false)
        }
      } catch {}
    }
    loadCache()

    if (page === 1) setLoading(true)
    else setLoadingMore(true)

    const params = new URLSearchParams({ limit: '50', page: page.toString() })
    if (jenis) params.set('jenis', jenis)
    
    fetch(`/api/setoran?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error || d.offline) return
        if (page === 1) {
          setSetorans(d.setorans || [])
        } else {
          setSetorans(prev => {
            const newItems = (d.setorans || []).filter((ns: Setoran) => !prev.some(p => p.id === ns.id))
            return [...prev, ...newItems]
          })
        }
        setTotal(d.total || 0)
      })
      .catch(() => {
        // Fallback offline filter from cache
        import('idb-keyval').then(({ get }) => {
          get('mutqin_cached_setoran_list').then((cached) => {
            if (cached && Array.isArray(cached)) {
              let list = cached as Setoran[]
              if (jenis) list = list.filter(s => s.jenis === jenis)
              setSetorans(list.slice(0, page * 50))
              setTotal(list.length)
            }
          }).catch(() => {})
        }).catch(() => {})
      })
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }, [jenis, page])

  const handleJenisChange = (newJenis: string) => {
    setJenis(newJenis)
    setPage(1)
  }

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
            <button id="filter-semua" className={`tab ${!jenis ? 'active' : ''}`} onClick={() => handleJenisChange('')}>Semua</button>
            <button id="filter-tahfidz" className={`tab ${jenis === 'TAHFIDZ' ? 'active' : ''}`} onClick={() => handleJenisChange('TAHFIDZ')}>📖 Tahfidz</button>
            <button id="filter-tahsin" className={`tab ${jenis === 'TAHSIN' ? 'active' : ''}`} onClick={() => handleJenisChange('TAHSIN')}>🗣 Tahsin</button>
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
                onClick={() => {
                  if (!navigator.onLine) {
                    localStorage.setItem('offline_nav_detail_id', s.siswa.id)
                    window.location.href = '/guru/siswa/detail'
                  } else {
                    router.push(`/guru/siswa/detail?id=${s.siswa.id}`)
                  }
                }}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                  background: s.jenis === 'TAHFIDZ' ? '#dbeafe' : '#fef3c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  {s.jenis === 'TAHFIDZ' ? '📖' : '🗣'}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.siswa.nama}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Kelas {s.siswa.kelas} · {s.surah || (s.jenis === 'TAHSIN' ? 'Tahsin' : '')} · {formatDate(s.tanggal)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{
                    fontSize: '20px', fontWeight: 800,
                    color: s.nilaiAkhir >= 90 ? '#059669' : s.nilaiAkhir >= 80 ? '#2563eb' : s.nilaiAkhir >= 70 ? '#d97706' : '#dc2626',
                  }}>
                    {Math.round(s.nilaiAkhir)}
                  </div>
                  <PredikatBadge predikat={s.predikat} />
                  {(session?.user as any)?.guruId === s.guruId && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!navigator.onLine) {
                          localStorage.setItem('offline_nav_id', s.siswa.id)
                          localStorage.setItem('offline_nav_jenis', s.jenis)
                          localStorage.setItem('offline_nav_edit_id', s.id)
                          window.location.href = '/guru/siswa/setoran'
                        } else {
                          router.push(`/guru/siswa/setoran?id=${s.siswa.id}&jenis=${s.jenis}&editId=${s.id}`)
                        }
                      }}
                      style={{ 
                        marginTop: '8px', padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', 
                        border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' 
                      }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>
              </button>
            ))
          )}
          
          {!loading && setorans.length < total && !search && (
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loadingMore}
              style={{
                width: '100%',
                padding: '12px',
                background: '#e2e8f0',
                color: '#475569',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                marginTop: '10px',
                cursor: 'pointer'
              }}
            >
              {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
            </button>
          )}
        </div>
      </div>

      <MobileNav role="guru" />
    </div>
  )
}
