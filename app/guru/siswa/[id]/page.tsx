'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MobileNav from '@/components/layout/MobileNav'

interface SiswaDetail {
  id: string
  nis: string
  nama: string
  kelas: string
  progress: number
  hasTasmi: boolean
  surahSelesai: string[]
  ortu?: { user: { name: string } }
  setorans: Array<{
    id: string
    jenis: string
    surah?: string
    ayatMulai?: number
    ayatAkhir?: number
    bukuTahsin?: string
    halamanTahsin?: string
    nilaiAkhir: number
    predikat: string
    catatan?: string
    isTasmi: boolean
    tanggal: string
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

function getInitials(nama: string) {
  return nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function DetailSiswaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [siswa, setSiswa] = useState<SiswaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'semua' | 'tahfidz' | 'tahsin'>('semua')

  useEffect(() => {
    fetch(`/api/siswa/${id}`)
      .then(r => r.json())
      .then(setSiswa)
      .finally(() => setLoading(false))
  }, [id])

  const filtered = siswa?.setorans.filter(s => {
    if (activeTab === 'tahfidz') return s.jenis === 'TAHFIDZ'
    if (activeTab === 'tahsin') return s.jenis === 'TAHSIN'
    return true
  }) || []

  if (loading) {
    return (
      <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
        <header className="mobile-header">
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a', padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: 700 }}>Detail Siswa</h1>
        </header>
        <div className="page-mobile">
          <div className="skeleton" style={{ height: '160px', borderRadius: '20px', marginTop: '12px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '80px', borderRadius: '16px', marginBottom: '12px' }} />
          <div className="skeleton" style={{ height: '60px', borderRadius: '16px' }} />
        </div>
        <MobileNav role="guru" />
      </div>
    )
  }

  if (!siswa) return null

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <header className="mobile-header">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a', padding: '4px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{ flex: 1, fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Detail Siswa</h1>
      </header>

      <div className="page-mobile">
        {/* Profile Card */}
        <div className="animate-fadeIn card" style={{ marginTop: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '64px', height: '64px', fontSize: '22px', fontWeight: 700,
              background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
              color: '#1e3a8a', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {getInitials(siswa.nama)}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>{siswa.nama}</h2>
              <div style={{ fontSize: '13px', color: '#64748b' }}>NIS {siswa.nis} · Kelas {siswa.kelas}</div>
              {siswa.ortu && (
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Wali: {siswa.ortu.user.name}</div>
              )}
            </div>
            {siswa.hasTasmi && (
              <div style={{
                background: '#d1fae5', color: '#059669',
                borderRadius: '10px', padding: '6px 10px',
                fontSize: '11px', fontWeight: 700, textAlign: 'center', flexShrink: 0,
              }}>
                ✅<br/>Tasmi'
              </div>
            )}
          </div>

          {/* Progress */}
          <div style={{ background: '#f8faff', borderRadius: '14px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Progress Juz 30</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {siswa.surahSelesai.length}/37 Surah selesai
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: siswa.progress >= 100 ? '#059669' : '#1e3a8a' }}>
                {siswa.progress}%
              </div>
            </div>
            <div className="progress-wrap">
              <div
                className={`progress-bar ${siswa.progress >= 100 ? 'success' : ''}`}
                style={{ width: `${Math.min(siswa.progress, 100)}%` }}
              />
            </div>
            {siswa.progress >= 100 && (
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '8px' }}>
                🎉 MasyaAllah! Target Juz 30 tercapai!
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button
            id="btn-input-tahfidz"
            onClick={() => router.push(`/guru/siswa/${id}/setoran?jenis=TAHFIDZ`)}
            className="btn btn-primary btn-lg"
            style={{ flexDirection: 'column', gap: '6px', height: '80px', borderRadius: '16px' }}
          >
            <span style={{ fontSize: '22px' }}>📖</span>
            <span>Tahfidz</span>
          </button>
          <button
            id="btn-input-tahsin"
            onClick={() => router.push(`/guru/siswa/${id}/setoran?jenis=TAHSIN`)}
            className="btn btn-accent btn-lg"
            style={{ flexDirection: 'column', gap: '6px', height: '80px', borderRadius: '16px' }}
          >
            <span style={{ fontSize: '22px' }}>🗣</span>
            <span>Tahsin</span>
          </button>
        </div>

        {/* Riwayat */}
        <div className="section-header">
          <h3 className="section-title">Riwayat Setoran</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{siswa.setorans.length} total</span>
        </div>

        <div className="tabs" style={{ margin: '12px 0' }}>
          {(['semua', 'tahfidz', 'tahsin'] as const).map(t => (
            <button key={t} id={`tab-${t}`} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'semua' ? 'Semua' : t === 'tahfidz' ? '📖 Tahfidz' : '🗣 Tahsin'}
            </button>
          ))}
        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>Belum ada setoran {activeTab !== 'semua' ? activeTab : ''}</p>
            </div>
          ) : (
            filtered.map(s => (
              <div key={s.id} style={{
                background: 'white', borderRadius: '16px', padding: '14px 16px',
                border: '1px solid rgba(30,58,138,0.06)', boxShadow: '0 2px 8px rgba(30,58,138,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: s.catatan ? '8px' : '0' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                        {s.jenis === 'TAHFIDZ' ? '📖' : '🗣'} {s.jenis === 'TAHFIDZ' ? 'Tahfidz' : 'Tahsin'}
                      </span>
                      {s.isTasmi && (
                        <span style={{ fontSize: '11px', background: '#d1fae5', color: '#059669', borderRadius: '8px', padding: '2px 8px', fontWeight: 600 }}>Tasmi'</span>
                      )}
                    </div>
                    {s.jenis === 'TAHFIDZ' && s.surah && (
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {s.surah} {s.ayatMulai && s.ayatAkhir ? `Ayat ${s.ayatMulai}-${s.ayatAkhir}` : ''}
                      </div>
                    )}
                    {s.jenis === 'TAHSIN' && s.bukuTahsin && (
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {s.bukuTahsin} {s.halamanTahsin ? `(Hal. ${s.halamanTahsin})` : ''}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{formatDate(s.tanggal)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '24px', fontWeight: 800, lineHeight: 1,
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
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Oleh: {s.guru.user.name}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <MobileNav role="guru" />
    </div>
  )
}
