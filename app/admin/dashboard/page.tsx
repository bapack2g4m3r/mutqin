'use client'

import { useEffect, useState } from 'react'

interface DashData {
  totalSiswa: number
  totalGuru: number
  setoranHariIni: number
  siswaBelumSetor: number
  setoranTerbaru: Array<{
    id: string; jenis: string; nilaiAkhir: number; predikat: string
    tanggal: string; surah?: string; bukuTahsin?: string; halamanTahsin?: string
    siswa: { nama: string; kelas: string; nis: string }
    guru: { user: { name: string } }
  }>
  predikatStats: Array<{ predikat: string; _count: { id: number } }>
  tahfidzStats: Array<{ capaianJuz: number; count: number }>
  tasmiCount: number
  tahsinStats: Array<{ buku: string; count: number }>
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
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [semesterAktif, setSemesterAktif] = useState('')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [kelasFilter, setKelasFilter] = useState('')
  const [kelasOptions, setKelasOptions] = useState<string[]>([])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard?kelas=${kelasFilter}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [kelasFilter])

  useEffect(() => {
    fetch('/api/settings/maintenance', { cache: 'no-store' }).then(r => r.json()).then(d => setMaintenanceMode(d.maintenanceMode || false)).catch(() => {})
    fetch('/api/settings/pts', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d) {
        setPtsEnabled(d.enabled ?? true)
        setPtsDateLabel(d.dateLabel || '21 - 23 September 2026')
        setPtsBobotHarian(d.bobotHarian ?? 40)
        setPtsBobotPts(d.bobotPts ?? 60)
        if (d.tipeUjian) setPtsTipeUjian(d.tipeUjian)
        if (d.judulUjian) setPtsJudulUjian(d.judulUjian)
      }
    }).catch(() => {})
    fetch('/api/akademik', { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.tahunAjaranList) {
        const aktif = d.tahunAjaranList.find((t: any) => t.isAktif)
        if (aktif) {
          setTahunAjaran(aktif.nama)
          // extract unique class names to populate the filter dropdown
          const uniqueClasses = Array.from(new Set(aktif.kelas.map((k: any) => k.nama.replace(/[^0-9]/g, '')))) as string[]
          setKelasOptions(uniqueClasses.sort())
        }
      }
      if (d.aktivSemester) setSemesterAktif(d.aktivSemester.nama)
    }).catch(() => {})
  }, [])

  // PTS Settings State
  const [ptsEnabled, setPtsEnabled] = useState(true)
  const [ptsDateLabel, setPtsDateLabel] = useState('21 - 23 September 2026')
  const [ptsBobotHarian, setPtsBobotHarian] = useState(40)
  const [ptsBobotPts, setPtsBobotPts] = useState(60)
  const [ptsTipeUjian, setPtsTipeUjian] = useState('PTS')
  const [ptsJudulUjian, setPtsJudulUjian] = useState('Penilaian Tengah Semester (PTS)')
  const [ptsSaving, setPtsSaving] = useState(false)
  const [ptsModalOpen, setPtsModalOpen] = useState(false)

  const handleSavePtsSettings = async () => {
    if (ptsBobotHarian + ptsBobotPts !== 100) {
      alert('Total persentase bobot Harian + Ujian harus berjumlah 100%!')
      return
    }
    setPtsSaving(true)
    try {
      const res = await fetch('/api/settings/pts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: ptsEnabled,
          dateLabel: ptsDateLabel,
          bobotHarian: ptsBobotHarian,
          bobotPts: ptsBobotPts,
          tipeUjian: ptsTipeUjian,
          judulUjian: ptsJudulUjian
        })
      })
      const d = await res.json()
      if (d.success) {
        alert('Pengaturan Ujian berhasil disimpan!')
        setPtsModalOpen(false)
      } else {
        alert(d.error || 'Gagal menyimpan pengaturan')
      }
    } catch {
      alert('Terjadi kesalahan')
    } finally {
      setPtsSaving(false)
    }
  }

  const toggleMaintenance = async () => {
    setToggling(true)
    try {
      const res = await fetch('/api/settings/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: !maintenanceMode })
      })
      const result = await res.json()
      if (result.success) {
        setMaintenanceMode(result.maintenanceMode)
      } else {
        alert('Gagal mengubah mode maintenance')
      }
    } catch (e) {
      alert('Terjadi kesalahan')
    } finally {
      setToggling(false)
    }
  }

  const totalSetoran = Math.max(data?.predikatStats.reduce((a, p) => a + p._count.id, 0) || 0, 1)

  return (
    <div style={{ padding: '32px', maxWidth: '1360px', margin: '0 auto' }}>
      {/* HEADER & ACTION TOOLBAR */}
      <div style={{
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '30px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              margin: 0
            }}>
              Dashboard
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: '#f1f5f9',
              color: '#475569',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              Live Monitor
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
            Selamat datang di panel admin MUTQIN · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* UNIFIED ACTION TOOLBAR */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Class Filter Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: '8px 14px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Kelas:</span>
            <select
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 700,
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer',
                paddingRight: '4px'
              }}
              value={kelasFilter}
              onChange={e => setKelasFilter(e.target.value)}
            >
              <option value="">Semua Tingkat</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
          </div>

          {/* Maintenance Mode Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'white',
            padding: '8px 14px',
            borderRadius: '14px',
            border: maintenanceMode ? '1px solid #fca5a5' : '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            backgroundClip: 'padding-box'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: maintenanceMode ? '#dc2626' : '#334155', lineHeight: 1.2 }}>
                Maintenance
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                {maintenanceMode ? 'Akses ditutup' : 'Akses aktif'}
              </span>
            </div>
            <button
              onClick={toggleMaintenance}
              disabled={toggling}
              title={maintenanceMode ? 'Matikan Mode Maintenance' : 'Aktifkan Mode Maintenance'}
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                background: maintenanceMode ? '#ef4444' : '#cbd5e1',
                position: 'relative',
                border: 'none',
                cursor: toggling ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '3px',
                left: maintenanceMode ? '21px' : '3px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
              }} />
            </button>
          </div>

          {/* PTS Exam Settings Interactive Card */}
          <div
            onClick={() => setPtsModalOpen(true)}
            role="button"
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'white',
              padding: '7px 14px',
              borderRadius: '14px',
              border: ptsEnabled ? '1px solid #93c5fd' : '1px solid #e2e8f0',
              boxShadow: ptsEnabled ? '0 2px 8px rgba(37, 99, 235, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a' }}>
                  {ptsTipeUjian || 'Ujian PTS'}
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: ptsEnabled ? '#dcfce7' : '#fee2e2',
                  color: ptsEnabled ? '#15803d' : '#b91c1c',
                  letterSpacing: '0.04em'
                }}>
                  {ptsEnabled ? 'AKTIF' : 'DITUTUP'}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                {ptsDateLabel}
              </div>
            </div>
            <div style={{
              background: '#eff6ff',
              color: '#1d4ed8',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⚙️ Kelola
            </div>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Total Siswa */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '20px 22px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Santri
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginTop: '6px' }}>
                {loading ? '—' : (data?.totalSiswa ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>
                Santri Terdaftar Aktif
              </div>
            </div>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Guru Tahfizh */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '20px 22px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Guru Tahfizh
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginTop: '6px' }}>
                {loading ? '—' : (data?.totalGuru ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                Pembina Halaqah
              </div>
            </div>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Setoran Hari Ini */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '20px 22px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #059669, #34d399)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Setoran Hari Ini
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#059669', letterSpacing: '-0.03em', marginTop: '6px' }}>
                {loading ? '—' : (data?.setoranHariIni ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                ✓ Aktivitas Tercatat
              </div>
            </div>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Belum Setor Hari Ini */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '20px 22px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #e11d48, #fb7185)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Belum Setoran
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#e11d48', letterSpacing: '-0.03em', marginTop: '6px' }}>
                {loading ? '—' : (data?.siswaBelumSetor ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#e11d48', fontWeight: 600, marginTop: '4px' }}>
                Menunggu Input Guru
              </div>
            </div>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#fff1f2',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* CAPAIAN SANTRI SECTION (3 KOLOM) */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
          Capaian Santri
        </h2>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Progress hafalan & tilawah semester aktif
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Capaian Tahfidz */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff',
                color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
              }}>
                📖
              </span>
              Capaian Tahfidz
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tingkat Juz</span>
          </div>

          {loading ? (
            <div className="skeleton" style={{ flex: 1, height: '140px', borderRadius: '12px' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {[
                { label: '< 1 Juz', val: 0, color: '#94a3b8' },
                { label: '1 Juz', val: 1, color: '#3b82f6' },
                { label: '2 Juz', val: 2, color: '#8b5cf6' },
                { label: '> 2 Juz', val: 3, color: '#10b981' },
              ].map(item => {
                const stat = data?.tahfidzStats?.find(s => s.capaianJuz === item.val)
                const count = stat ? stat.count : 0
                const pct = data?.totalSiswa ? Math.round((count / data.totalSiswa) * 100) : 0
                return (
                  <div key={item.val}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{item.label}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{count} <span style={{ fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: '8px', width: '100%', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: item.color, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Capaian Tahsin (Jilid) */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb',
                color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
              }}>
                🗣️
              </span>
              Capaian Tahsin (Jilid)
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tingkatan Buku</span>
          </div>

          {loading ? (
            <div className="skeleton" style={{ flex: 1, height: '140px', borderRadius: '12px' }} />
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data?.tahsinStats && data.tahsinStats.length > 0 ? (
                data.tahsinStats.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #f1f5f9'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{item.buku}</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#1e3a8a',
                      background: '#dbeafe',
                      padding: '2px 8px',
                      borderRadius: '8px'
                    }}>
                      {item.count} Santri
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Belum ada data setoran tahsin
                </div>
              )}
            </div>
          )}
        </div>

        {/* KPI SUDAH TASMI' (EMERALD LUXE CARD) */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
          borderRadius: '18px',
          padding: '24px',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(4, 120, 87, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Background Glow */}
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none'
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '8px',
                fontSize: '12px', fontWeight: 700
              }}>
                ⭐ KPI Ujian
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Status Kelulusan
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '10px' }}>
              Santri Sudah Tasmi&apos;
            </div>
          </div>

          <div style={{ margin: '16px 0' }}>
            {loading ? (
              <div className="skeleton" style={{ width: '120px', height: '60px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)' }} />
            ) : (
              <div style={{ fontSize: '54px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {data?.totalSiswa ? Math.round(((data?.tasmiCount || 0) / data.totalSiswa) * 100) : 0}%
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{data?.tasmiCount || 0} dari {data?.totalSiswa || 0} Santri</span>
            <span style={{ opacity: 0.8 }}>Tuntas Diuji</span>
          </div>
        </div>
      </div>

      {/* DISTRIBUSI PREDIKAT & INFO SEKOLAH (2 KOLOM) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Distribusi Predikat Card */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
              📊 Distribusi Nilai & Predikat
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Berdasarkan seluruh setoran</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '36px', borderRadius: '8px' }} />)}
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
                      <span style={{ fontSize: '13px', fontWeight: 700, color: info.color }}>{info.label}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{count} <span style={{ fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: '8px', width: '100%', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: info.color, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Profil Lembaga SMP Global Insani (Deep Navy Card) */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a8a 100%)',
          borderRadius: '18px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{
                background: 'rgba(255,255,255,0.12)',
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#93c5fd'
              }}>
                MUTQIN v1.0
              </span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
              SMP Global Insani
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '18px' }}>
              Pusat Manajemen Mutaba&apos;ah Tahfizh
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Tahun Ajaran', value: tahunAjaran || '—' },
                { label: 'Semester Aktif', value: semesterAktif || '—' },
                { label: 'Target Utama', value: 'Juz 30 (37 Surah)' },
                { label: 'Status Sistem', value: maintenanceMode ? 'Maintenance' : 'Operasional Normal' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '12px'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: 'white' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center'
          }}>
            Tajurhalang, Bogor · Terintegrasi Realtime
          </div>
        </div>
      </div>

      {/* RECENT SETORAN TABLE */}
      <div style={{
        background: 'white',
        borderRadius: '18px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>
              Aktivitas Setoran Terbaru
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Riwayat setoran santri yang baru saja diinput oleh guru
            </div>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            background: '#f1f5f9',
            color: '#475569',
            padding: '4px 10px',
            borderRadius: '10px'
          }}>
            10 Catatan Terakhir
          </span>
        </div>

        <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Santri</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Kelas</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Program</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Materi</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Nilai</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Predikat</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Guru Pembina</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div className="skeleton" style={{ height: '16px', borderRadius: '6px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                data?.setoranTerbaru.map((s, idx) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? 'white' : '#fafafa',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '10px',
                          background: '#eff6ff', color: '#1d4ed8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 800, flexShrink: 0
                        }}>
                          {s.siswa.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{s.siswa.nama}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>NIS: {s.siswa.nis || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      Kelas {s.siswa.kelas}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                        background: s.jenis === 'TAHFIDZ' ? '#eff6ff' : '#fef3c7',
                        color: s.jenis === 'TAHFIDZ' ? '#1d4ed8' : '#b45309',
                      }}>
                        {s.jenis === 'TAHFIDZ' ? '📖 Tahfidz' : '🗣️ Tahsin'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569', fontSize: '12px', fontWeight: 600 }}>
                      {s.jenis === 'TAHFIDZ' ? (s.surah || '—') : (s.bukuTahsin || '—')}
                    </td>
                    <td style={{
                      padding: '12px 14px', textAlign: 'center', fontWeight: 800, fontSize: '14px',
                      color: s.nilaiAkhir >= 90 ? '#059669' : s.nilaiAkhir >= 80 ? '#2563eb' : s.nilaiAkhir >= 70 ? '#d97706' : '#dc2626'
                    }}>
                      {Math.round(s.nilaiAkhir)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge ${s.predikat === 'MUMTAZ' ? 'badge-mumtaz' : s.predikat === 'JAYYID_JIDDAN' ? 'badge-jayyidj' : s.predikat === 'JAYYID' ? 'badge-jayyid' : 'badge-ghair'}`}>
                        {s.predikat === 'MUMTAZ' ? 'Mumtaz' : s.predikat === 'JAYYID_JIDDAN' ? 'Jayyid Jiddan' : s.predikat === 'JAYYID' ? 'Jayyid' : 'Ghair Maqbul'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>{s.guru.user.name}</td>
                    <td style={{ padding: '12px 20px', color: '#64748b', fontSize: '12px' }}>{formatDate(s.tanggal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PENGATURAN UJIAN PTS */}
      {ptsModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                  ⚙️ Pengaturan Ujian PTS
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Kelola akses input nilai ujian tengah semester & bobot rapor
                </p>
              </div>
              <button
                onClick={() => setPtsModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            {/* 1. TOGGLE ON / OFF */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                  Status Akses Input Nilai Ujian
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {ptsEnabled ? 'Guru DAPAT menginput & mengedit nilai' : 'Akses DITUTUP (Guru hanya bisa melihat)'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPtsEnabled(!ptsEnabled)}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  background: ptsEnabled ? '#10b981' : '#cbd5e1',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: ptsEnabled ? '25px' : '3px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            {/* PILIHAN JENIS UJIAN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Jenis Ujian
                </label>
                <select
                  className="input"
                  value={ptsTipeUjian}
                  onChange={e => {
                    const val = e.target.value
                    setPtsTipeUjian(val)
                    if (val === 'PTS') setPtsJudulUjian('Penilaian Tengah Semester (PTS)')
                    else if (val === 'PAS') setPtsJudulUjian('Penilaian Akhir Semester (PAS)')
                    else if (val === 'PAT') setPtsJudulUjian('Penilaian Akhir Tahun (PAT)')
                    else if (val === 'TASMI') setPtsJudulUjian("Ujian Tasmi' / Kenaikan Jilid")
                  }}
                  style={{ width: '100%', boxSizing: 'border-box', fontWeight: 700 }}
                >
                  <option value="PTS">PTS</option>
                  <option value="PAS">PAS</option>
                  <option value="PAT">PAT</option>
                  <option value="TASMI">Tasmi&apos; / Jilid</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Judul / Nama Ujian
                </label>
                <input
                  type="text"
                  className="input"
                  value={ptsJudulUjian}
                  onChange={e => setPtsJudulUjian(e.target.value)}
                  placeholder="Contoh: Penilaian Tengah Semester (PTS)"
                  style={{ width: '100%', boxSizing: 'border-box', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* 2. TANGGAL PELAKSANAAN */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Jadwal / Tanggal Pelaksanaan
              </label>
              <input
                type="text"
                className="input"
                value={ptsDateLabel}
                onChange={e => setPtsDateLabel(e.target.value)}
                placeholder="Contoh: 21 - 23 September 2026"
                style={{ width: '100%', boxSizing: 'border-box', fontWeight: 600 }}
              />
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Teks ini otomatis tampil di banner Dashboard Guru dan header ujian.
              </div>
            </div>

            {/* 3. BOBOT RAPOR */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                ⚖️ Pembobotan Nilai Akhir Rapor (Total harus 100%)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Bobot Harian (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="input"
                    value={ptsBobotHarian}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setPtsBobotHarian(val)
                      setPtsBobotPts(100 - val)
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', fontWeight: 800, fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Bobot Ujian PTS (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="input"
                    value={ptsBobotPts}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setPtsBobotPts(val)
                      setPtsBobotHarian(100 - val)
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', fontWeight: 800, fontSize: '16px' }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px',
                fontSize: '12px',
                fontWeight: 600,
                color: ptsBobotHarian + ptsBobotPts === 100 ? '#10b981' : '#dc2626'
              }}>
                <span>Total Bobot: {ptsBobotHarian + ptsBobotPts}%</span>
                <span>{ptsBobotHarian + ptsBobotPts === 100 ? '✓ Valid (100%)' : '✕ Harus berjumlah 100%'}</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPtsModalOpen(false)}
                disabled={ptsSaving}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePtsSettings}
                disabled={ptsSaving}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#1e3a8a',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {ptsSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
