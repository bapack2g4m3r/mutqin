'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { JUZ_30_SURAHS, calcNilaiTahfidz, calcNilaiTahsin, getPredikat } from '@/lib/surah-data'

type Jenis = 'TAHFIDZ' | 'TAHSIN'

interface SiswaInfo {
  id: string
  nama: string
  kelas: string
  nis: string
}

function NilaiSlider({ label, value, onChange, weight }: {
  label: string; value: number; onChange: (v: number) => void; weight: string
}) {
  const color = value >= 90 ? '#059669' : value >= 80 ? '#2563eb' : value >= 70 ? '#d97706' : '#dc2626'
  return (
    <div className="slider-wrap">
      <div className="slider-header">
        <div>
          <span className="slider-label">{label}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>({weight})</span>
        </div>
        <span className="slider-value" style={{ color }}>{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))} style={{ accentColor: color }} />
    </div>
  )
}

export default function InputSetoranPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const siswaId = params.id as string
  const jenisParam = (searchParams.get('jenis') || 'TAHFIDZ').toUpperCase() as Jenis

  const [jenis, setJenis] = useState<Jenis>(jenisParam)
  const [siswa, setSiswa] = useState<SiswaInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Tahfidz fields
  const [surah, setSurah] = useState('')
  const [ayatMulai, setAyatMulai] = useState(1)
  const [ayatAkhir, setAyatAkhir] = useState(10)
  const [isTasmi, setIsTasmi] = useState(false)
  const [kelancaran, setKelancaran] = useState(85)
  const [tajwid, setTajwid] = useState(85)
  const [makhorijTahfidz, setMakhorijTahfidz] = useState(85)

  // Custom surah dropdown state
  const [showSurahModal, setShowSurahModal] = useState(false)
  const [searchSurah, setSearchSurah] = useState('')

  // Tahsin fields
  const [makhorijTahsin, setMakhorijTahsin] = useState(85)
  const [sifatulHuruf, setSifatulHuruf] = useState(85)
  const [ahkamulMad, setAhkamulMad] = useState(85)
  const [ahkamulWaqaf, setAhkamulWaqaf] = useState(85)

  const [catatan, setCatatan] = useState('')

  useEffect(() => {
    fetch(`/api/siswa/${siswaId}`).then(r => r.json()).then(setSiswa)
  }, [siswaId])

  // Realtime nilai calculation
  const nilaiTahfidz = calcNilaiTahfidz({ kelancaran, tajwid, makhorijulHuruf: makhorijTahfidz })
  const nilaiTahsin = calcNilaiTahsin({ makhorijulHuruf: makhorijTahsin, sifatulHuruf, ahkamulMad, ahkamulWaqaf })
  const nilaiAkhir = jenis === 'TAHFIDZ' ? nilaiTahfidz : nilaiTahsin
  const predikat = getPredikat(nilaiAkhir)

  const predikatColors: Record<string, string> = {
    MUMTAZ: '#059669', JAYYID_JIDDAN: '#2563eb', JAYYID: '#d97706', GHAIR_MAQBUL: '#dc2626',
  }
  const nilaiColor = predikatColors[predikat.kode] || '#64748b'

  async function handleSave() {
    if (jenis === 'TAHFIDZ' && !surah) { alert('Pilih surah terlebih dahulu'); return }
    setLoading(true)
    try {
      const body: any = { siswaId, jenis, catatan: catatan || null }
      if (jenis === 'TAHFIDZ') {
        body.surah = surah
        body.ayatMulai = ayatMulai
        body.ayatAkhir = ayatAkhir
        body.isTasmi = isTasmi
        body.nilaiKomponen = { kelancaran, tajwid, makhorijulHuruf: makhorijTahfidz }
      } else {
        body.nilaiKomponen = { makhorijulHuruf: makhorijTahsin, sifatulHuruf, ahkamulMad, ahkamulWaqaf }
      }
      const res = await fetch('/api/setoran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Gagal')
      setSuccess(true)
    } catch {
      alert('Gagal menyimpan setoran. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const selectedSurah = JUZ_30_SURAHS.find(s => s.nama === surah)
  
  const filteredSurahs = JUZ_30_SURAHS.filter(s => 
    s.nama.toLowerCase().includes(searchSurah.toLowerCase()) || 
    s.namaArab.includes(searchSurah)
  )

  const badgeCls = predikat.kode === 'MUMTAZ' ? 'badge-mumtaz' : predikat.kode === 'JAYYID_JIDDAN' ? 'badge-jayyidj' : predikat.kode === 'JAYYID' ? 'badge-jayyid' : 'badge-ghair'

  // Success Screen
  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--surface-bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px', textAlign: 'center',
      }}>
        <div className="animate-scaleIn success-circle" style={{ marginBottom: '24px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="animate-fadeIn" style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Berhasil Disimpan!</h2>
        <p className="animate-fadeIn" style={{ color: '#64748b', marginBottom: '12px' }}>
          Setoran {siswa?.nama} telah dicatat
        </p>
        <div className="animate-scaleIn" style={{ fontSize: '48px', fontWeight: 900, color: nilaiColor, marginBottom: '4px', lineHeight: 1 }}>
          {nilaiAkhir}
        </div>
        <span className={`badge animate-fadeIn ${badgeCls}`} style={{ fontSize: '14px', padding: '6px 20px', marginBottom: '32px', marginTop: '4px' }}>
          {predikat.grade} — {predikat.label}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
          <button id="btn-siswa-berikutnya" className="btn btn-primary btn-lg" onClick={() => router.push('/guru/siswa')}>
            Siswa Berikutnya
          </button>
          <button id="btn-kembali-detail" className="btn btn-outline" onClick={() => router.push(`/guru/siswa/${siswaId}`)}>
            Kembali ke Detail Siswa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <header className="mobile-header">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a', padding: '4px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Input Setoran</h1>
          {siswa && <div style={{ fontSize: '12px', color: '#64748b' }}>{siswa.nama} · Kelas {siswa.kelas}</div>}
        </div>
      </header>

      <div className="page-mobile">
        {/* Live Score Display */}
        <div className="animate-fadeIn" style={{
          background: 'white', borderRadius: '24px', padding: '20px',
          textAlign: 'center', marginTop: '12px', marginBottom: '16px',
          boxShadow: '0 4px 20px rgba(30,58,138,0.08)',
          border: `2px solid ${nilaiColor}22`,
          transition: 'border-color 0.3s ease',
        }}>
          <div style={{ fontSize: '60px', fontWeight: 900, color: nilaiColor, lineHeight: 1, marginBottom: '8px', transition: 'color 0.3s ease' }}>
            {nilaiAkhir}
          </div>
          <span className={`badge ${badgeCls}`} style={{ fontSize: '14px', padding: '5px 16px' }}>
            {predikat.grade} — {predikat.label}
          </span>
        </div>

        {/* Jenis Tab */}
        <div className="tabs" style={{ marginBottom: '16px' }}>
          <button id="tab-tahfidz" className={`tab ${jenis === 'TAHFIDZ' ? 'active' : ''}`} onClick={() => setJenis('TAHFIDZ')}>📖 Tahfidz</button>
          <button id="tab-tahsin" className={`tab ${jenis === 'TAHSIN' ? 'active' : ''}`} onClick={() => setJenis('TAHSIN')}>🗣 Tahsin</button>
        </div>

        {jenis === 'TAHFIDZ' && (
          <>
            <div className="form-section" style={{ marginBottom: '12px' }}>
              <div className="form-section-title">Bacaan</div>
              <div className="input-group">
                <label className="input-label">Surah (Juz 30)</label>
                <div 
                  className="input" 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 16px', background: 'white' }}
                  onClick={() => setShowSurahModal(true)}
                >
                  {selectedSurah ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#f0f9ff', padding: '2px 8px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#0ea5e9' }}>{selectedSurah.id}</span>
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>{selectedSurah.nama}</span>
                      <span style={{ fontSize: '16px', color: '#1e293b', marginLeft: 'auto', fontWeight: 500 }}>{selectedSurah.namaArab}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>— Pilih Surah —</span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0, marginLeft: '8px' }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              {surah && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Ayat Mulai</label>
                    <input type="number" className="input" value={ayatMulai} min={1} max={selectedSurah?.jumlahAyat || 100} onChange={e => setAyatMulai(Number(e.target.value))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Ayat Akhir</label>
                    <input type="number" className="input" value={ayatAkhir} min={1} max={selectedSurah?.jumlahAyat || 100} onChange={e => setAyatAkhir(Number(e.target.value))} />
                  </div>
                </div>
              )}
              <div className="toggle-wrap">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Tasmi&apos;</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Centang jika sudah tasmi</div>
                </div>
                <label className="toggle">
                  <input id="toggle-tasmi" type="checkbox" checked={isTasmi} onChange={e => setIsTasmi(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="form-section" style={{ marginBottom: '12px' }}>
              <div className="form-section-title">Penilaian Tahfidz</div>
              <NilaiSlider label="Kelancaran" value={kelancaran} onChange={setKelancaran} weight="40%" />
              <NilaiSlider label="Tajwid" value={tajwid} onChange={setTajwid} weight="40%" />
              <NilaiSlider label="Makhorijul Huruf" value={makhorijTahfidz} onChange={setMakhorijTahfidz} weight="20%" />
            </div>
          </>
        )}

        {jenis === 'TAHSIN' && (
          <div className="form-section" style={{ marginBottom: '12px' }}>
            <div className="form-section-title">Penilaian Tahsin</div>
            <NilaiSlider label="Makhorijul Huruf" value={makhorijTahsin} onChange={setMakhorijTahsin} weight="25%" />
            <NilaiSlider label="Sifatul Huruf" value={sifatulHuruf} onChange={setSifatulHuruf} weight="25%" />
            <NilaiSlider label="Ahkamul Mad" value={ahkamulMad} onChange={setAhkamulMad} weight="25%" />
            <NilaiSlider label="Ahkamul Waqaf" value={ahkamulWaqaf} onChange={setAhkamulWaqaf} weight="25%" />
          </div>
        )}

        <div className="form-section" style={{ marginBottom: '24px' }}>
          <div className="form-section-title">Catatan (Opsional)</div>
          <textarea
            id="input-catatan"
            className="input"
            placeholder="Contoh: Lancar, tajwid bagus. Perlu latihan mad..."
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            rows={3}
            style={{ resize: 'none' }}
          />
        </div>

        <button
          id="btn-simpan-setoran"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: '24px' }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <><span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> Menyimpan...</>
          ) : '✓ Terima Setoran'}
        </button>
      </div>

      {/* Surah Selection Modal */}
      {showSurahModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 200,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', backdropFilter: 'blur(4px)'
        }}>
          <div className="animate-slideUp" style={{
            background: 'white', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.1)'
          }}>
            <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '4px', margin: '0 auto 16px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Pilih Surah</h3>
              <button onClick={() => setShowSurahModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '10px', color: '#64748b' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Cari surah..." 
                  value={searchSurah}
                  onChange={e => setSearchSurah(e.target.value)}
                  style={{ paddingLeft: '42px', borderRadius: '12px' }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column' }}>
              {filteredSurahs.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => {
                    setSurah(s.nama);
                    setAyatMulai(1);
                    setAyatAkhir(s.jumlahAyat);
                    setShowSurahModal(false);
                    setSearchSurah('');
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '14px 8px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', background: '#f0f9ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700, color: '#0ea5e9'
                    }}>
                      {s.id}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>{s.nama}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>Juz {s.juz} · {s.jumlahAyat} ayat</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 500, color: '#1e293b' }}>
                    {s.namaArab}
                  </div>
                </div>
              ))}
              
              {filteredSurahs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  Surah tidak ditemukan
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
