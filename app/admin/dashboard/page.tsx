'use client'

import { useEffect, useState } from 'react'

interface DashData {
  totalSiswa: number
  totalGuru: number
  setoranHariIni: number
  siswaBelumSetor: number
  setoranTerbaru: Array<{
    id: string; jenis: string; nilaiAkhir: number; predikat: string
    tanggal: string; surah?: string
    siswa: { nama: string; kelas: string; nis: string }
    guru: { user: { name: string } }
  }>
  predikatStats: Array<{ predikat: string; _count: { id: number } }>
}

const PREDIKAT_INFO: Record<string, { label: string; color: string }> = {
  MUMTAZ:        { label: 'Mumtaz (A)',        color: '#059669' },
  JAYYID_JIDDAN: { label: 'Jayyid Jiddan (B)', color: '#2563eb' },
  JAYYID:        { label: 'Jayyid (C)',          color: '#d97706' },
  GHAIR_MAQBUL:  { label: 'Ghair Maqbul (K)',   color: '#dc2626' },
}

function StatCard({ value, label, color, icon }: { value: number | string; label: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="stat-card animate-fadeIn">
      <div className="stat-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  const totalSetoran = Math.max(data?.predikatStats.reduce((a, p) => a + p._count.id, 0) || 0, 1)

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Selamat datang di panel admin MUTQIN · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }} className="stagger-children">
        <StatCard value={loading ? '—' : data?.totalSiswa ?? 0} label="Total Siswa" color="#2563eb"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard value={loading ? '—' : data?.totalGuru ?? 0} label="Total Guru" color="#d97706"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        />
        <StatCard value={loading ? '—' : data?.setoranHariIni ?? 0} label="Setoran Hari Ini" color="#059669"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
        <StatCard value={loading ? '—' : data?.siswaBelumSetor ?? 0} label="Belum Setor Hari Ini" color="#dc2626"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '24px' }}>
        {/* Distribusi Predikat */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '20px' }}>Distribusi Predikat</div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '36px', borderRadius: '8px' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['MUMTAZ', 'JAYYID_JIDDAN', 'JAYYID', 'GHAIR_MAQBUL'].map(p => {
                const stat = data?.predikatStats.find(s => s.predikat === p)
                const count = stat?._count.id || 0
                const pct = Math.round((count / totalSetoran) * 100)
                const info = PREDIKAT_INFO[p]
                return (
                  <div key={p}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: info.color }}>{info.label}</span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="progress-wrap">
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: '9999px', background: info.color, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* School Info */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>SMP Global Insani</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Total Siswa', value: `${data?.totalSiswa ?? 0} siswa` },
              { label: 'Total Guru', value: `${data?.totalGuru ?? 0} guru` },
              { label: 'Tahun Ajaran', value: '2025/2026' },
              { label: 'Target Hafalan', value: 'Juz 30 (37 Surah)' },
              { label: 'Sistem', value: 'MUTQIN v1.0' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Setoran Table */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '20px' }}>Setoran Terbaru</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Siswa</th><th>Kelas</th><th>Jenis</th><th>Surah</th>
                <th>Nilai</th><th>Predikat</th><th>Guru</th><th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} /></td>
                  ))}</tr>
                ))
              ) : (
                data?.setoranTerbaru.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.siswa.nama}</td>
                    <td>{s.siswa.kelas}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        background: s.jenis === 'TAHFIDZ' ? '#dbeafe' : '#fef3c7',
                        color: s.jenis === 'TAHFIDZ' ? '#1d4ed8' : '#b45309',
                      }}>
                        {s.jenis === 'TAHFIDZ' ? '📖 Tahfidz' : '🗣 Tahsin'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{s.surah || '—'}</td>
                    <td style={{ fontWeight: 700, color: s.nilaiAkhir >= 90 ? '#059669' : s.nilaiAkhir >= 80 ? '#2563eb' : s.nilaiAkhir >= 70 ? '#d97706' : '#dc2626' }}>
                      {Math.round(s.nilaiAkhir)}
                    </td>
                    <td>
                      <span className={`badge ${s.predikat === 'MUMTAZ' ? 'badge-mumtaz' : s.predikat === 'JAYYID_JIDDAN' ? 'badge-jayyidj' : s.predikat === 'JAYYID' ? 'badge-jayyid' : 'badge-ghair'}`}>
                        {s.predikat === 'MUMTAZ' ? 'Mumtaz' : s.predikat === 'JAYYID_JIDDAN' ? 'Jayyid Jiddan' : s.predikat === 'JAYYID' ? 'Jayyid' : 'Ghair Maqbul'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{s.guru.user.name}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{formatDate(s.tanggal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
