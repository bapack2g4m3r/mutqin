'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import MobileNav from '@/components/layout/MobileNav'

interface SiswaDetail {
  id: string; nama: string; kelas: string; nis: string
  progress: number; hasTasmi: boolean; surahSelesai: string[]
  setorans: Array<{
    id: string; jenis: string; surah?: string; nilaiAkhir: number
    ayatMulai?: number; ayatAkhir?: number; bukuTahsin?: string; halamanTahsin?: string
    predikat: string; catatan?: string; isTasmi: boolean; tanggal: string
    guru: { user: { name: string } }
  }>
}

function PredikatBadge({ predikat }: { predikat: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    MUMTAZ:        { label: 'A — Mumtaz',       cls: 'badge-mumtaz' },
    JAYYID_JIDDAN: { label: 'B — Jayyid Jiddan', cls: 'badge-jayyidj' },
    JAYYID:        { label: 'C — Jayyid',         cls: 'badge-jayyid' },
    GHAIR_MAQBUL:  { label: 'K — Ghair Maqbul',   cls: 'badge-ghair' },
  }
  const p = map[predikat] || { label: predikat, cls: 'badge-jayyid' }
  return <span className={`badge ${p.cls}`}>{p.label}</span>
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function OrtuDashboardPage() {
  const { data: session } = useSession()
  const [siswa, setSiswa] = useState<SiswaDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const siswaId = (session?.user as any)?.siswaId
  const parentName = session?.user?.name?.split(' ')[0] || 'Orang Tua'

  useEffect(() => {
    if (!siswaId) return
    function fetchData() {
      fetch(`/api/siswa/${siswaId}`)
        .then(r => r.json())
        .then(setSiswa)
        .finally(() => setLoading(false))
    }
    fetchData()
    const interval = setInterval(fetchData, 30000) // auto-refresh 30s
    return () => clearInterval(interval)
  }, [siswaId])

  const lastTahfidz = siswa?.setorans.find(s => s.jenis === 'TAHFIDZ')
  const lastTahsin  = siswa?.setorans.find(s => s.jenis === 'TAHSIN')

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <header className="mobile-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            <div style={{ fontSize: '10px', color: '#64748b' }}>Portal Orang Tua</div>
          </div>
        </div>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 0 2px #d1fae5' }} />
          <span style={{ fontSize: '11px', color: '#64748b' }}>Live</span>
        </div>
      </header>

      <div className="page-mobile">
        {/* Greeting Banner */}
        <div className="animate-fadeIn" style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)',
          borderRadius: '24px', padding: '24px',
          marginTop: '12px', marginBottom: '20px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginBottom: '4px' }}>Assalamu'alaikum,</p>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>{parentName} 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '16px' }}>Berikut perkembangan anak Anda</p>

          {siswa && (
            <div style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: '14px',
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {siswa.nama.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>{siswa.nama}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>NIS {siswa.nis} · Kelas {siswa.kelas}</div>
              </div>
              {siswa.hasTasmi && (
                <div style={{ background: 'rgba(5,150,105,0.3)', color: '#6ee7b7', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}>
                  ✅ Tasmi'
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Card */}
        {loading ? (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="skeleton" style={{ height: '16px', width: '40%', borderRadius: '6px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ height: '8px', borderRadius: '8px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '12px', width: '30%', borderRadius: '6px' }} />
          </div>
        ) : siswa ? (
          <div className="card animate-fadeIn" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>Progress Hafalan Juz 30</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  {siswa.surahSelesai.length} dari 37 surah selesai
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: siswa.progress >= 100 ? '#059669' : '#1e3a8a', lineHeight: 1 }}>
                {siswa.progress}%
              </div>
            </div>
            <div className="progress-wrap" style={{ height: '10px', marginBottom: '8px' }}>
              <div className={`progress-bar ${siswa.progress >= 100 ? 'success' : ''}`} style={{ width: `${Math.min(siswa.progress, 100)}%` }} />
            </div>
            {siswa.progress >= 100 ? (
              <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>🎉 MasyaAllah! Target Juz 30 telah tercapai!</div>
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b' }}>Target: Juz 30 · Tahun Ajaran 2025/2026</div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px', marginBottom: '16px' }}>
            Data siswa tidak ditemukan. Hubungi pihak sekolah.
          </div>
        )}

        {/* Last Setoran */}
        <h3 className="section-title" style={{ marginBottom: '12px' }}>Setoran Terakhir</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }} className="stagger-children">
          {[lastTahfidz, lastTahsin].map((s, idx) => {
            const label = idx === 0 ? 'Tahfidz' : 'Tahsin'
            if (!s) return (
              <div key={idx} style={{
                background: 'white', borderRadius: '16px', padding: '16px',
                border: '1.5px dashed #e2e8f0', color: '#94a3b8',
                fontSize: '13px', textAlign: 'center',
              }}>
                Belum ada setoran {label}
              </div>
            )
            return (
              <div key={s.id} style={{
                background: 'white', borderRadius: '16px', padding: '16px',
                border: '1px solid rgba(30,58,138,0.06)', boxShadow: '0 2px 8px rgba(30,58,138,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: s.catatan ? '8px' : '0' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '2px' }}>
                      {s.jenis === 'TAHFIDZ' ? '📖 Tahfidz' : '🗣 Tahsin'}
                      {s.jenis === 'TAHFIDZ' && s.surah ? ` · ${s.surah}${s.ayatMulai && s.ayatAkhir ? ` Ayat ${s.ayatMulai}-${s.ayatAkhir}` : ''}` : ''}
                      {s.jenis === 'TAHSIN' && s.bukuTahsin ? ` · ${s.bukuTahsin}${s.halamanTahsin ? ` (Hal. ${s.halamanTahsin})` : ''}` : ''}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{formatDate(s.tanggal)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '28px', fontWeight: 900, lineHeight: 1,
                      color: s.nilaiAkhir >= 90 ? '#059669' : s.nilaiAkhir >= 80 ? '#2563eb' : s.nilaiAkhir >= 70 ? '#d97706' : '#dc2626',
                    }}>
                      {Math.round(s.nilaiAkhir)}
                    </div>
                    <PredikatBadge predikat={s.predikat} />
                  </div>
                </div>
                {s.catatan && (
                  <div style={{ fontSize: '12px', color: '#64748b', background: '#f8faff', borderRadius: '8px', padding: '8px 10px', fontStyle: 'italic' }}>
                    💬 {s.catatan}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Dinilai oleh: {s.guru.user.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      <MobileNav role="ortu" />
    </div>
  )
}
