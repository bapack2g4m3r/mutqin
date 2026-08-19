'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { QURAN_SURAHS, calcNilaiTahfidz, calcNilaiTahsin, getPredikat } from '@/lib/surah-data'

type Jenis = 'TAHFIDZ' | 'TAHSIN'

interface SiswaInfo {
  id: string
  nama: string
  kelas: string
  nis: string
}

// Juz 30 surah IDs (An-Naba = 78 ... An-Nas = 114)
const JUZ30_IDS = [78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114]
const JUZ30_SURAHS = QURAN_SURAHS.filter(s => JUZ30_IDS.includes(s.id))
const OFFLINE_QUEUE_KEY = 'mutqin_offline_queue'

function NilaiInput({ label, value, onChange, weight }: {
  label: string; value: number; onChange: (v: number) => void; weight: string
}) {
  const color = value >= 90 ? '#059669' : value >= 80 ? '#2563eb' : value >= 70 ? '#d97706' : '#dc2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{label}</span>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>({weight})</span>
      </div>
      <input 
        type="number" 
        min={0} max={100} 
        value={value || ''} 
        onChange={e => {
          let v = parseInt(e.target.value) || 0
          if (v > 100) v = 100
          if (v < 0) v = 0
          onChange(v)
        }} 
        style={{ 
          width: '56px', padding: '4px 6px', 
          borderRadius: '6px', border: '1px solid #cbd5e1',
          fontSize: '14px', fontWeight: 'bold', 
          color: color, textAlign: 'center', outline: 'none',
          transition: 'border-color 0.2s',
          backgroundColor: '#f8fafc'
        }}
        onFocus={e => {
          e.target.style.borderColor = '#2563eb'
          e.target.style.backgroundColor = '#ffffff'
        }}
        onBlur={e => {
          e.target.style.borderColor = '#cbd5e1'
          e.target.style.backgroundColor = '#f8fafc'
        }}
      />
    </div>
  )
}

function SurahAutocomplete({ value, onChange }: { value: string; onChange: (nama: string, jumlahAyat: number) => void }) {
  const [inputVal, setInputVal] = useState(value)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value
  useEffect(() => { setInputVal(value) }, [value])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search
    ? QURAN_SURAHS.filter(s =>
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.namaArab.includes(search) ||
        String(s.id).includes(search)
      ).slice(0, 15)
    : JUZ30_SURAHS  // Juz 30 as default suggestions

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="input"
          placeholder="Ketik nama surah atau nomor..."
          value={open ? search : inputVal}
          onFocus={() => { setOpen(true); setSearch('') }}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          autoComplete="off"
          style={{ paddingRight: '36px' }}
        />
        {inputVal && !open && (
          <button
            type="button"
            onClick={() => { onChange('', 0); setInputVal(''); setSearch(''); inputRef.current?.focus() }}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'white', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1px solid #e2e8f0', maxHeight: '280px', overflowY: 'auto',
        }}>
          {!search && (
            <div style={{ padding: '10px 14px 6px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Juz 30 — Juz Amma
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Surah tidak ditemukan</div>
          )}
          {filtered.map(s => (
            <div
              key={s.id}
              onMouseDown={e => {
                e.preventDefault()
                onChange(s.nama, s.jumlahAyat)
                setInputVal(s.nama)
                setOpen(false)
                setSearch('')
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', cursor: 'pointer',
                background: inputVal === s.nama ? '#f0f9ff' : 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
              onMouseLeave={e => (e.currentTarget.style.background = inputVal === s.nama ? '#f0f9ff' : 'transparent')}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#0ea5e9', flexShrink: 0 }}>
                {s.id}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{s.nama}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Juz {s.juz} · {s.jumlahAyat} ayat</div>
              </div>
              <div style={{ fontSize: '17px', color: '#1e293b', fontWeight: 500 }}>{s.namaArab}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InputSetoranPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const siswaId = searchParams.get('id')
  const editId = searchParams.get('editId')
  const jenisFromUrl = (searchParams.get('jenis') || 'TAHFIDZ').toUpperCase() as Jenis

  const [jenis, setJenis] = useState<Jenis>(jenisFromUrl)
  const [siswa, setSiswa] = useState<SiswaInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isOfflineSaved, setIsOfflineSaved] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Tahfidz fields
  const [surah, setSurah] = useState('')
  const [ayatMulai, setAyatMulai] = useState(1)
  const [ayatAkhir, setAyatAkhir] = useState(10)
  const [isTasmi, setIsTasmi] = useState(false)
  const [kelancaran, setKelancaran] = useState(85)
  const [tajwid, setTajwid] = useState(85)
  const [makhorijTahfidz, setMakhorijTahfidz] = useState(85)

  // Tahsin fields
  const [makhorijTahsin, setMakhorijTahsin] = useState(85)
  const [sifatulHuruf, setSifatulHuruf] = useState(85)
  const [ahkamulMad, setAhkamulMad] = useState(85)
  const [ahkamulWaqaf, setAhkamulWaqaf] = useState(85)
  const [bukuTahsin, setBukuTahsin] = useState('Metode Ummi Jilid 1')
  const [halamanTahsin, setHalamanTahsin] = useState('')

  const [catatan, setCatatan] = useState('')
  const [tanggal, setTanggal] = useState<string>(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!siswaId) return
    // 1. Instantly read from cached student list
    try {
      const cached = localStorage.getItem('mutqin_cached_siswa_list')
      if (cached) {
        const list = JSON.parse(cached)
        const found = list.find((s: any) => s.id === siswaId)
        if (found) setSiswa(found)
      }
    } catch {}

    // 2. Fetch fresh details from API
    fetch(`/api/siswa/${siswaId}`)
      .then(r => {
        if (!r.ok) throw new Error('Offline')
        return r.json()
      })
      .then(d => {
        if (d && !d.error) setSiswa(d)
      })
      .catch(() => {})

    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
  }, [siswaId])

  useEffect(() => {
    if (!editId) return
    fetch(`/api/setoran/${editId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) return
        setJenis(d.jenis)
        if (d.tanggal) setTanggal(d.tanggal.split('T')[0])
        setCatatan(d.catatan || '')
        
        if (d.jenis === 'TAHFIDZ') {
          setSurah(d.surah || '')
          setAyatMulai(d.ayatMulai || 1)
          setAyatAkhir(d.ayatAkhir || 10)
          setIsTasmi(d.isTasmi || false)
          if (d.nilaiKomponen) {
            try {
              const parsed = JSON.parse(d.nilaiKomponen)
              if (parsed.kelancaran) setKelancaran(parsed.kelancaran)
              if (parsed.tajwid) setTajwid(parsed.tajwid)
              if (parsed.makhorijulHuruf) setMakhorijTahfidz(parsed.makhorijulHuruf)
            } catch {}
          }
        } else {
          setBukuTahsin(d.bukuTahsin || 'Metode Ummi Jilid 1')
          setHalamanTahsin(d.halamanTahsin || '')
          if (d.nilaiKomponen) {
            try {
              const parsed = JSON.parse(d.nilaiKomponen)
              if (parsed.makhorijulHuruf) setMakhorijTahsin(parsed.makhorijulHuruf)
              if (parsed.sifatulHuruf) setSifatulHuruf(parsed.sifatulHuruf)
              if (parsed.ahkamulMad) setAhkamulMad(parsed.ahkamulMad)
              if (parsed.ahkamulWaqaf) setAhkamulWaqaf(parsed.ahkamulWaqaf)
            } catch {}
          }
        }
      })
      .catch(() => {})
  }, [editId])

  const nilaiTahfidz = calcNilaiTahfidz({ kelancaran, tajwid, makhorijulHuruf: makhorijTahfidz })
  const nilaiTahsin = calcNilaiTahsin({ makhorijulHuruf: makhorijTahsin, sifatulHuruf, ahkamulMad, ahkamulWaqaf })
  const nilaiAkhir = jenis === 'TAHFIDZ' ? nilaiTahfidz : nilaiTahsin
  const predikat = getPredikat(nilaiAkhir)

  const predikatColors: Record<string, string> = {
    MUMTAZ: '#059669', JAYYID_JIDDAN: '#2563eb', JAYYID: '#d97706', GHAIR_MAQBUL: '#dc2626',
  }
  const nilaiColor = predikatColors[predikat.kode] || '#64748b'

  function buildBody() {
    const body: any = { siswaId, jenis, catatan: catatan || null }
    if (tanggal) {
      // Create date at noon local time to avoid timezone shift to previous day
      const d = new Date(tanggal)
      d.setHours(12, 0, 0, 0)
      body.tanggal = d.toISOString()
    }

    if (jenis === 'TAHFIDZ') {
      body.surah = surah
      body.ayatMulai = ayatMulai
      body.ayatAkhir = ayatAkhir
      body.isTasmi = isTasmi
      body.nilaiKomponen = { kelancaran, tajwid, makhorijulHuruf: makhorijTahfidz }
    } else {
      body.bukuTahsin = bukuTahsin
      body.halamanTahsin = halamanTahsin
      body.nilaiKomponen = { makhorijulHuruf: makhorijTahsin, sifatulHuruf, ahkamulMad, ahkamulWaqaf }
    }
    return body
  }

  function saveToOfflineQueue(body: any) {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
      const queue: any[] = raw ? JSON.parse(raw) : []
      queue.push({ id: Date.now(), body, savedAt: new Date().toISOString() })
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    } catch {}
  }

  async function handleSave() {
    if (jenis === 'TAHFIDZ' && !surah) { alert('Pilih surah terlebih dahulu'); return }
    setLoading(true)
    const body = buildBody()

    if (!navigator.onLine && !editId) {
      // Simpan ke antrian offline langsung (hanya untuk setoran baru)
      saveToOfflineQueue(body)
      setIsOfflineSaved(true)
      setSuccess(true)
      setLoading(false)
      return
    }

    try {
      const res = await fetch(editId ? `/api/setoran/${editId}` : '/api/setoran', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Gagal')
      setSuccess(true)
    } catch {
      if (!editId) {
        // Gagal karena koneksi lemah — simpan ke antrian offline (setoran baru)
        saveToOfflineQueue(body)
        setIsOfflineSaved(true)
        setSuccess(true)
      } else {
        alert('Gagal menyimpan perubahan. Pastikan perangkat online.')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedSurah = QURAN_SURAHS.find(s => s.nama === surah)
  const badgeCls = predikat.kode === 'MUMTAZ' ? 'badge-mumtaz' : predikat.kode === 'JAYYID_JIDDAN' ? 'badge-jayyidj' : predikat.kode === 'JAYYID' ? 'badge-jayyid' : 'badge-ghair'

  // Success Screen
  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--surface-bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px', textAlign: 'center',
      }}>
        <div className="animate-scaleIn success-circle" style={{ marginBottom: '24px', background: isOfflineSaved ? 'linear-gradient(135deg, #d97706, #f59e0b)' : undefined }}>
          {isOfflineSaved ? (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
            </svg>
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <h2 className="animate-fadeIn" style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
          {isOfflineSaved ? 'Disimpan Offline!' : 'Berhasil Disimpan!'}
        </h2>
        <p className="animate-fadeIn" style={{ color: '#64748b', marginBottom: isOfflineSaved ? '4px' : '12px' }}>
          Setoran {siswa?.nama} telah dicatat
        </p>
        {isOfflineSaved && (
          <p className="animate-fadeIn" style={{ color: '#d97706', fontSize: '13px', marginBottom: '12px', background: '#fef3c7', padding: '8px 16px', borderRadius: '10px' }}>
            📶 Akan terkirim otomatis saat kembali online
          </p>
        )}
        {!isOfflineSaved && (
          <>
            <div className="animate-scaleIn" style={{ fontSize: '48px', fontWeight: 900, color: nilaiColor, marginBottom: '4px', lineHeight: 1 }}>
              {nilaiAkhir}
            </div>
            <span className={`badge animate-fadeIn ${badgeCls}`} style={{ fontSize: '14px', padding: '6px 20px', marginBottom: '32px', marginTop: '4px' }}>
              {predikat.grade} — {predikat.label}
            </span>
          </>
        )}
        {isOfflineSaved && <div style={{ marginBottom: '24px' }} />}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
          <button 
            id="btn-input-lagi" 
            className="btn btn-primary btn-lg" 
            onClick={() => {
              setSuccess(false);
              setSurah('');
              setAyatMulai(1);
              setAyatAkhir(10);
              setCatatan('');
              setHalamanTahsin('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Input Surah Lain untuk {siswa?.nama.split(' ')[0]}
          </button>
          <button id="btn-siswa-berikutnya" className="btn btn-outline" style={{ border: '2px solid #e2e8f0', color: '#475569', background: 'white' }} onClick={() => { router.push(`/guru/siswa${siswa?.kelas ? `?kelas=${encodeURIComponent(siswa.kelas)}` : ''}`) }}>
            Pilih Siswa Lain di Kelas Ini
          </button>
          <button id="btn-kembali-detail" className="btn btn-outline" style={{ border: 'none', color: '#64748b' }} onClick={() => { router.push(`/guru/siswa/detail?id=${siswaId}`) }}>
            Kembali ke Profil Siswa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <header className="mobile-header">
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3a8a', padding: '4px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>{editId ? 'Edit Setoran' : 'Input Setoran'}</h1>
          {siswa && <div style={{ fontSize: '12px', color: '#64748b' }}>{siswa.nama} · Kelas {siswa.kelas}</div>}
        </div>
        {/* Offline indicator */}
        {!isOnline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', borderRadius: '8px', padding: '4px 8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }} />
            <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 600 }}>Offline</span>
          </div>
        )}
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

        {/* Tanggal Setoran */}
        <div className="form-section" style={{ marginBottom: '12px' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="input-tanggal">Tanggal Setoran</label>
            <input 
              id="input-tanggal"
              type="date" 
              className="input" 
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // prevent future date
            />
          </div>
        </div>

        {jenis === 'TAHFIDZ' && (
          <>
            <div className="form-section" style={{ marginBottom: '12px' }}>
              <div className="form-section-title">Bacaan</div>
              <div className="input-group">
                <label className="input-label">Surah <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Juz 30 tampil otomatis)</span></label>
                <SurahAutocomplete
                  value={surah}
                  onChange={(nama, jumlahAyat) => {
                    setSurah(nama)
                    if (nama) { setAyatMulai(1); setAyatAkhir(jumlahAyat) }
                  }}
                />
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
              <NilaiInput label="Kelancaran" value={kelancaran} onChange={setKelancaran} weight="40%" />
              <NilaiInput label="Tajwid" value={tajwid} onChange={setTajwid} weight="40%" />
              <NilaiInput label="Makhorijul Huruf" value={makhorijTahfidz} onChange={setMakhorijTahfidz} weight="20%" />
            </div>
          </>
        )}

        {jenis === 'TAHSIN' && (
          <>
            <div className="form-section" style={{ marginBottom: '12px' }}>
              <div className="form-section-title">Materi</div>
              <div className="input-group">
                <label className="input-label">Metode / Buku</label>
                <select className="input" value={bukuTahsin} onChange={e => setBukuTahsin(e.target.value)}>
                  <option value="Metode Ummi Jilid 1">Metode Ummi Jilid 1</option>
                  <option value="Metode Ummi Jilid 2">Metode Ummi Jilid 2</option>
                  <option value="Metode Ummi Jilid 3">Metode Ummi Jilid 3</option>
                  <option value="Metode Ummi Jilid 4">Metode Ummi Jilid 4</option>
                  <option value="Metode Ummi Jilid 5">Metode Ummi Jilid 5</option>
                  <option value="Metode Ummi Jilid 6">Metode Ummi Jilid 6</option>
                  <option value="Al-Quran">Al-Quran</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Halaman / Ayat</label>
                <input type="text" className="input" placeholder="Contoh: Hal 12-14" value={halamanTahsin} onChange={e => setHalamanTahsin(e.target.value)} />
              </div>
            </div>

            <div className="form-section" style={{ marginBottom: '12px' }}>
              <div className="form-section-title">Penilaian Tahsin</div>
              <NilaiInput label="Makhorijul Huruf" value={makhorijTahsin} onChange={setMakhorijTahsin} weight="25%" />
              <NilaiInput label="Sifatul Huruf" value={sifatulHuruf} onChange={setSifatulHuruf} weight="25%" />
              <NilaiInput label="Ahkamul Mad" value={ahkamulMad} onChange={setAhkamulMad} weight="25%" />
              <NilaiInput label="Ahkamul Waqaf" value={ahkamulWaqaf} onChange={setAhkamulWaqaf} weight="25%" />
            </div>
          </>
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
          style={{ width: '100%', marginBottom: editId ? '12px' : '24px' }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <><span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> Menyimpan...</>
          ) : editId ? '✓ Simpan Perubahan' : '✓ Terima Setoran'}
        </button>
        
        {editId && (
          <button
            className="btn btn-outline"
            style={{ width: '100%', marginBottom: '24px', color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
            onClick={async () => {
              if (confirm('Yakin ingin menghapus setoran ini? Aksi ini tidak dapat dibatalkan.')) {
                setLoading(true)
                try {
                  const res = await fetch(`/api/setoran/${editId}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error('Gagal')
                  router.push(`/guru/siswa/detail?id=${siswaId}`)
                } catch {
                  alert('Gagal menghapus data')
                  setLoading(false)
                }
              }
            }}
            disabled={loading}
          >
            Hapus Setoran
          </button>
        )}
      </div>
    </div>
  )
}
