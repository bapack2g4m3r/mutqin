'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MobileNav from '@/components/layout/MobileNav'

interface DashboardData {
  totalSiswa: number
  setoranHariIni: number
  siswaBelumSetor: number
  setoranTerbaru: Array<{
    id: string
    jenis: string
    nilaiAkhir: number
    predikat: string
    tanggal: string
    surah?: string
    siswa: { nama: string; kelas: string }
    guru: { user: { name: string } }
  }>
}

function PredikatBadge({ predikat }: { predikat: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    MUMTAZ:       { label: 'Mumtaz',        cls: 'badge-mumtaz' },
    JAYYID_JIDDAN:{ label: 'Jayyid Jiddan', cls: 'badge-jayyidj' },
    JAYYID:       { label: 'Jayyid',         cls: 'badge-jayyid' },
    GHAIR_MAQBUL: { label: 'Ghair Maqbul',   cls: 'badge-ghair' },
  }
  const p = map[predikat] || { label: predikat, cls: 'badge-jayyid' }
  return <span className={`badge ${p.cls}`}>{p.label}</span>
}

function getInitials(nama: string) {
  return nama.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function GuruDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  const userName = session?.user?.name?.split(' ')[0] || 'Guru'

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      {/* Mobile Header */}
      <header className="mobile-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M11 3H3v8h8V3z" fill="rgba(255,255,255,0.9)"/>
              <path d="M21 3h-8v8h8V3z" fill="rgba(255,255,255,0.5)"/>
              <path d="M21 13h-8v8h8v-8z" fill="rgba(255,255,255,0.7)"/>
              <path d="M11 13H3v8h8v-8z" fill="rgba(255,255,255,0.3)"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a8a', lineHeight: 1.2 }}>MUTQIN</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Global Insani School</div>
          </div>
        </div>
        <button
          id="btn-input-setoran-quick"
          onClick={() => router.push('/guru/siswa')}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '12px' }}
        >
          + Setoran
        </button>
      </header>

      <div className="page-mobile">
        {/* Welcome Banner */}
        <div className="animate-fadeIn" style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)',
          borderRadius: '24px',
          padding: '24px 20px',
          marginTop: '12px',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '120px', height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', right: '40px',
            width: '80px', height: '80px',
            borderRadius: '50%',
            background: 'rgba(180,83,9,0.15)',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginBottom: '4px' }}>
            Assalamu'alaikum,
          </p>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
            {userName} 👋
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: '14px',
              padding: '12px 16px',
              flex: 1,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>
                {loading ? '—' : data?.setoranHariIni ?? 0}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Setoran Hari Ini</div>
            </div>
            <div style={{
              background: 'rgba(180,83,9,0.25)',
              borderRadius: '14px',
              padding: '12px 16px',
              flex: 1,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fcd34d' }}>
                {loading ? '—' : data?.siswaBelumSetor ?? 0}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Belum Setor</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button
            id="btn-cari-siswa"
            onClick={() => router.push('/guru/siswa')}
            className="card card-sm"
            style={{ border: 'none', cursor: 'pointer', textAlign: 'left', padding: '16px' }}
          >
            <div style={{
              width: '40px', height: '40px',
              background: 'var(--color-primary-50)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '10px',
              color: 'var(--color-primary-700)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Cari Siswa</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Input setoran baru</div>
          </button>

          <button
            id="btn-riwayat"
            onClick={() => router.push('/guru/riwayat')}
            className="card card-sm"
            style={{ border: 'none', cursor: 'pointer', textAlign: 'left', padding: '16px' }}
          >
            <div style={{
              width: '40px', height: '40px',
              background: '#fef3c7',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '10px',
              color: '#b45309',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Riwayat</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Lihat semua setoran</div>
          </button>
        </div>

        {/* Setoran Terbaru */}
        <div className="section-header">
          <h3 className="section-title">Setoran Terbaru</h3>
          <button className="section-link" onClick={() => router.push('/guru/riwayat')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Lihat Semua</button>
        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '8px', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '40%', borderRadius: '6px' }} />
                </div>
              </div>
            ))
          ) : data?.setoranTerbaru.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>Belum ada setoran hari ini</p>
            </div>
          ) : (
            data?.setoranTerbaru.slice(0, 6).map((s) => (
              <div key={s.id} className="list-item" style={{ cursor: 'default' }}>
                <div className="avatar-placeholder avatar-md">
                  {getInitials(s.siswa.nama)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{s.siswa.nama}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Kelas {s.siswa.kelas} · {s.jenis === 'TAHFIDZ' ? '📖 Tahfidz' : '🗣 Tahsin'}
                        {s.surah ? ` · ${s.surah}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <PredikatBadge predikat={s.predikat} />
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{formatDate(s.tanggal)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <MobileNav role="guru" />
    </div>
  )
}
