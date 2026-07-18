'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import MobileNav from '@/components/layout/MobileNav'

interface Setoran {
  id: string; jenis: string; surah?: string; nilaiAkhir: number
  predikat: string; catatan?: string; isTasmi: boolean; tanggal: string
  guru: { user: { name: string } }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function OrtuRiwayatPage() {
  const { data: session } = useSession()
  const [setorans, setSetorans] = useState<Setoran[]>([])
  const [loading, setLoading] = useState(true)
  const [jenis, setJenis] = useState('')
  const siswaId = (session?.user as any)?.siswaId

  useEffect(() => {
    if (!siswaId) return
    setLoading(true)
    const p = new URLSearchParams({ siswaId, limit: '100' })
    if (jenis) p.set('jenis', jenis)
    fetch(`/api/setoran?${p}`)
      .then(r => r.json())
      .then(d => setSetorans(d.setorans || []))
      .finally(() => setLoading(false))
  }, [siswaId, jenis])

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <header className="mobile-header" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Riwayat Setoran</h1>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{setorans.length} setoran</span>
      </header>

      <div className="page-mobile">
        <div style={{ marginTop: '12px', marginBottom: '16px' }}>
          <div className="tabs">
            <button id="ortu-filter-semua" className={`tab ${!jenis ? 'active' : ''}`} onClick={() => setJenis('')}>Semua</button>
            <button id="ortu-filter-tahfidz" className={`tab ${jenis === 'TAHFIDZ' ? 'active' : ''}`} onClick={() => setJenis('TAHFIDZ')}>📖 Tahfidz</button>
            <button id="ortu-filter-tahsin" className={`tab ${jenis === 'TAHSIN' ? 'active' : ''}`} onClick={() => setJenis('TAHSIN')}>🗣 Tahsin</button>
          </div>
        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '16px', height: '90px' }}>
                <div className="skeleton" style={{ height: '14px', width: '50%', borderRadius: '6px', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '12px', width: '30%', borderRadius: '6px' }} />
              </div>
            ))
          ) : setorans.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <p>Belum ada riwayat setoran</p>
            </div>
          ) : (
            setorans.map(s => (
              <div key={s.id} style={{
                background: 'white', borderRadius: '16px', padding: '14px 16px',
                border: '1px solid rgba(30,58,138,0.06)', boxShadow: '0 2px 8px rgba(30,58,138,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: s.catatan ? '8px' : '0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '2px' }}>
                      {s.jenis === 'TAHFIDZ' ? '📖 Tahfidz' : '🗣 Tahsin'}
                      {s.surah ? ` · ${s.surah}` : ''}
                      {s.isTasmi && (
                        <span style={{ marginLeft: '6px', fontSize: '11px', background: '#d1fae5', color: '#059669', borderRadius: '6px', padding: '1px 6px' }}>Tasmi'</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(s.tanggal)} · {s.guru.user.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '22px', fontWeight: 800, lineHeight: 1,
                      color: s.nilaiAkhir >= 90 ? '#059669' : s.nilaiAkhir >= 80 ? '#2563eb' : s.nilaiAkhir >= 70 ? '#d97706' : '#dc2626',
                    }}>
                      {Math.round(s.nilaiAkhir)}
                    </div>
                    <span className={`badge ${s.predikat === 'MUMTAZ' ? 'badge-mumtaz' : s.predikat === 'JAYYID_JIDDAN' ? 'badge-jayyidj' : s.predikat === 'JAYYID' ? 'badge-jayyid' : 'badge-ghair'}`}>
                      {s.predikat === 'MUMTAZ' ? 'Mumtaz' : s.predikat === 'JAYYID_JIDDAN' ? 'Jayyid Jiddan' : s.predikat === 'JAYYID' ? 'Jayyid' : 'Ghair Maqbul'}
                    </span>
                  </div>
                </div>
                {s.catatan && (
                  <div style={{ fontSize: '12px', color: '#64748b', background: '#f8faff', borderRadius: '8px', padding: '7px 10px', fontStyle: 'italic' }}>
                    💬 {s.catatan}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <MobileNav role="ortu" />
    </div>
  )
}
