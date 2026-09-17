'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MobileNav from '@/components/layout/MobileNav'
import { getPredikat } from '@/lib/surah-data'

const OFFLINE_PTS_QUEUE_KEY = 'mutqin_offline_pts_queue'
const CACHE_PTS_KEY = 'mutqin_cached_ujian_pts'

interface PtsQueueItem {
  id: string
  body: {
    siswaId: string
    jenis?: string
    nilai: number
    isTasmi?: boolean
    materiUjian?: string | null
  }
  savedAt: string
}

function getOfflinePtsQueue(): PtsQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_PTS_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToOfflinePtsQueue(body: any) {
  try {
    const queue = getOfflinePtsQueue()
    const existingIndex = queue.findIndex(q => q.body.siswaId === body.siswaId)
    const item: PtsQueueItem = {
      id: 'pts-' + body.siswaId + '-' + Date.now(),
      body,
      savedAt: new Date().toISOString()
    }
    if (existingIndex >= 0) {
      queue[existingIndex] = item
    } else {
      queue.push(item)
    }
    localStorage.setItem(OFFLINE_PTS_QUEUE_KEY, JSON.stringify(queue))
    window.dispatchEvent(new Event('storage'))
  } catch (e) {
    console.error('Failed to save to offline queue', e)
  }
}

function removeFromOfflinePtsQueue(siswaId: string) {
  try {
    const queue = getOfflinePtsQueue()
    const filtered = queue.filter(q => q.body.siswaId !== siswaId)
    localStorage.setItem(OFFLINE_PTS_QUEUE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new Event('storage'))
  } catch {}
}

interface SiswaPtsItem {
  id: string
  nama: string
  nis: string
  kelas: string
  kelasId: string
  hasPts: boolean
  pts: {
    id: string
    jenis: string
    isTasmi?: boolean
    nilaiAkhir: number
    predikat: string
    catatan?: string | null
    tanggal: string
  } | null
}

interface KelasGroup {
  kelasId: string
  kelasNama: string
  totalSiswa: number
  sudahUjianCount: number
  siswa: SiswaPtsItem[]
}

function getInitials(nama: string) {
  return nama.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function GuruUjianPtsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kelasGroups, setKelasGroups] = useState<KelasGroup[]>([])
  const [selectedKelas, setSelectedKelas] = useState<string>('SEMUA')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSemester, setActiveSemester] = useState<{ id: string; nama: string; tahunAjaran: string } | null>(null)
  const [ptsSettings, setPtsSettings] = useState<{ enabled: boolean; dateLabel: string; tipeUjian?: string; judulUjian?: string }>({
    enabled: true,
    dateLabel: '21 - 23 September 2026',
    tipeUjian: 'PTS',
    judulUjian: 'Penilaian Tengah Semester (PTS)'
  })

  // State per baris siswa
  const [scores, setScores] = useState<Record<string, string>>({})
  const [tasmis, setTasmis] = useState<Record<string, boolean>>({})
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({})
  const [savedSuccessIds, setSavedSuccessIds] = useState<Record<string, boolean>>({})
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({})
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({})
  const [offlineQueuedIds, setOfflineQueuedIds] = useState<Record<string, boolean>>({})

  // Input refs for auto-focus next student on Enter
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const refreshOfflineQueue = useCallback(() => {
    const queue = getOfflinePtsQueue()
    const map: Record<string, boolean> = {}
    queue.forEach(q => {
      map[q.body.siswaId] = true
    })
    setOfflineQueuedIds(map)
  }, [])

  const fetchData = async () => {
    // 1. INSTANT LOCAL CACHE: Load immediately so page renders with 0ms delay even offline
    try {
      const cachedRaw = localStorage.getItem(CACHE_PTS_KEY)
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw)
        if (cached && cached.kelasGroups) {
          setKelasGroups(cached.kelasGroups || [])
          setActiveSemester(cached.activeSemester || null)
          if (cached.ptsSettings) setPtsSettings(cached.ptsSettings)

          const initialScores: Record<string, string> = {}
          const initialTasmis: Record<string, boolean> = {}
          cached.kelasGroups?.forEach((g: KelasGroup) => {
            g.siswa.forEach(s => {
              if (s.pts) {
                initialScores[s.id] = String(s.pts.nilaiAkhir ?? '')
                initialTasmis[s.id] = !!s.pts.isTasmi
              }
            })
          })
          setScores(prev => ({ ...initialScores, ...prev }))
          setTasmis(prev => ({ ...initialTasmis, ...prev }))
          setLoading(false)
        }
      }
    } catch {}

    // 2. NETWORK FETCH: Update fresh data from server
    try {
      const res = await fetch('/api/guru/ujian-pts')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (data && data.kelasGroups) {
        setKelasGroups(data.kelasGroups || [])
        setActiveSemester(data.activeSemester || null)
        if (data.ptsSettings) {
          setPtsSettings(data.ptsSettings)
        }
        try {
          localStorage.setItem(CACHE_PTS_KEY, JSON.stringify(data))
        } catch {}

        // Populate scores & tasmis from existing data
        const initialScores: Record<string, string> = {}
        const initialTasmis: Record<string, boolean> = {}
        data.kelasGroups?.forEach((g: KelasGroup) => {
          g.siswa.forEach(s => {
            if (s.pts) {
              initialScores[s.id] = String(s.pts.nilaiAkhir ?? '')
              initialTasmis[s.id] = !!s.pts.isTasmi
            }
          })
        })
        setScores(prev => ({ ...initialScores, ...prev }))
        setTasmis(prev => ({ ...initialTasmis, ...prev }))
      }
    } catch (err) {
      console.warn('Network fetch PTS failed, using offline cache if available:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    refreshOfflineQueue()

    const handleStorage = () => refreshOfflineQueue()
    const handleOnline = () => {
      refreshOfflineQueue()
      fetchData()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('online', handleOnline)
    }
  }, [refreshOfflineQueue])

  // Flatten all students
  const allSiswa = useMemo(() => {
    const list: SiswaPtsItem[] = []
    kelasGroups.forEach(g => {
      g.siswa.forEach(s => list.push(s))
    })
    return list
  }, [kelasGroups])

  const totalAllSiswa = allSiswa.length
  const totalSudahUjian = allSiswa.filter(s => s.hasPts).length
  const totalBelumUjian = totalAllSiswa - totalSudahUjian
  const persenSelesai = totalAllSiswa > 0 ? Math.round((totalSudahUjian / totalAllSiswa) * 100) : 0

  // Filtered students by class and search
  const filteredSiswa = useMemo(() => {
    return allSiswa.filter(s => {
      const matchKelas = selectedKelas === 'SEMUA' || s.kelasId === selectedKelas
      const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery)
      return matchKelas && matchSearch
    })
  }, [allSiswa, selectedKelas, searchQuery])

  // OPTIMISTIC SAVE: Instantly updates local UI with 0ms delay, syncs in background
  const handleSaveRow = async (siswa: SiswaPtsItem, currentIndex?: number) => {
    if (!ptsSettings.enabled) return

    const rawScore = scores[siswa.id]
    if (rawScore === undefined || rawScore === '') {
      alert(`Mohon masukkan angka nilai untuk ${siswa.nama}`)
      return
    }

    const numScore = Number(rawScore)
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      alert('Nilai harus berupa angka antara 0 sampai 100')
      return
    }

    const isTasmiChecked = !!tasmis[siswa.id]
    const predikatInfo = getPredikat(numScore)

    // 1. OPTIMISTIC UPDATE: Update UI immediately so the teacher never waits!
    const prevKelasGroups = kelasGroups

    setKelasGroups(prev => prev.map(group => {
      if (group.kelasId !== siswa.kelasId) return group
      const updatedSiswaList = group.siswa.map(item => {
        if (item.id !== siswa.id) return item
        return {
          ...item,
          hasPts: true,
          pts: {
            id: item.pts?.id || 'temp-' + item.id,
            jenis: item.pts?.jenis || 'TAHFIDZ',
            isTasmi: isTasmiChecked,
            nilaiAkhir: numScore,
            predikat: predikatInfo.label,
            catatan: item.pts?.catatan || null,
            tanggal: new Date().toISOString()
          }
        }
      })
      return {
        ...group,
        sudahUjianCount: updatedSiswaList.filter(s => s.hasPts).length,
        siswa: updatedSiswaList
      }
    }))

    // Close editing mode after save
    setEditingIds(prev => ({ ...prev, [siswa.id]: false }))

    // Show instant success feedback
    setSavedSuccessIds(prev => ({ ...prev, [siswa.id]: true }))
    setTimeout(() => {
      setSavedSuccessIds(prev => ({ ...prev, [siswa.id]: false }))
    }, 2500)

    // 2. AUTO-FOCUS NEXT STUDENT: Automatically focus next student's input if not in edit mode
    if (!siswa.hasPts && currentIndex !== undefined && currentIndex + 1 < filteredSiswa.length) {
      const nextSiswa = filteredSiswa[currentIndex + 1]
      setTimeout(() => {
        inputRefs.current[nextSiswa.id]?.focus()
        inputRefs.current[nextSiswa.id]?.select()
      }, 50)
    }

    // 3. BACKGROUND SYNC: Send to database or queue locally if offline
    setSavingIds(prev => ({ ...prev, [siswa.id]: true }))
    const payload = {
      siswaId: siswa.id,
      jenis: siswa.pts?.jenis || 'TAHFIDZ',
      nilai: numScore,
      isTasmi: isTasmiChecked,
      materiUjian: isTasmiChecked ? 'Tasmi' : null
    }

    // Persist optimistic update to local cache
    try {
      const cachedRaw = localStorage.getItem(CACHE_PTS_KEY)
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw)
        cached.kelasGroups = prevKelasGroups.map(group => {
          if (group.kelasId !== siswa.kelasId) return group
          return {
            ...group,
            siswa: group.siswa.map(item => {
              if (item.id !== siswa.id) return item
              return {
                ...item,
                hasPts: true,
                pts: {
                  id: item.pts?.id || 'temp-' + item.id,
                  jenis: item.pts?.jenis || 'TAHFIDZ',
                  isTasmi: isTasmiChecked,
                  nilaiAkhir: numScore,
                  predikat: predikatInfo.label,
                  catatan: item.pts?.catatan || null,
                  tanggal: new Date().toISOString()
                }
              }
            })
          }
        })
        localStorage.setItem(CACHE_PTS_KEY, JSON.stringify(cached))
      }
    } catch {}

    // If currently offline, queue immediately without throwing error
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      saveToOfflinePtsQueue(payload)
      refreshOfflineQueue()
      setSavingIds(prev => ({ ...prev, [siswa.id]: false }))
      return
    }

    try {
      const res = await fetch('/api/guru/ujian-pts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Gagal menyimpan ke server')
      }

      const resData = await res.json()
      if (resData.pts) {
        removeFromOfflinePtsQueue(siswa.id)
        refreshOfflineQueue()

        // Sync real DB id silently
        setKelasGroups(prev => prev.map(group => {
          if (group.kelasId !== siswa.kelasId) return group
          return {
            ...group,
            siswa: group.siswa.map(item => {
              if (item.id !== siswa.id) return item
              return {
                ...item,
                pts: {
                  ...item.pts!,
                  id: resData.pts.id
                }
              }
            })
          }
        }))
      }
    } catch (err: any) {
      // Network error or connection dropped: DO NOT revert UI, queue offline instead!
      console.warn('Network save failed, saving to offline queue:', err)
      saveToOfflinePtsQueue(payload)
      refreshOfflineQueue()
    } finally {
      setSavingIds(prev => ({ ...prev, [siswa.id]: false }))
    }
  }

  // DELETE EXAM SCORE: Delete exam score and revert back to "Belum Ujian"
  const handleDeleteRow = async (siswa: SiswaPtsItem) => {
    if (!ptsSettings.enabled) return
    const confirmed = window.confirm(`Apakah antum yakin ingin menghapus nilai ujian untuk ${siswa.nama}? Nilai ini akan dihapus dari rapor.`)
    if (!confirmed) return

    setDeletingIds(prev => ({ ...prev, [siswa.id]: true }))
    const prevKelasGroups = kelasGroups

    // Optimistic delete
    setKelasGroups(prev => prev.map(group => {
      if (group.kelasId !== siswa.kelasId) return group
      const updatedSiswaList = group.siswa.map(item => {
        if (item.id !== siswa.id) return item
        return {
          ...item,
          hasPts: false,
          pts: null
        }
      })
      return {
        ...group,
        sudahUjianCount: updatedSiswaList.filter(s => s.hasPts).length,
        siswa: updatedSiswaList
      }
    }))

    // Reset scores & tasmis state
    setScores(prev => ({ ...prev, [siswa.id]: '' }))
    setTasmis(prev => ({ ...prev, [siswa.id]: false }))
    setEditingIds(prev => ({ ...prev, [siswa.id]: false }))

    // Remove from offline queue if exists
    removeFromOfflinePtsQueue(siswa.id)
    refreshOfflineQueue()

    // Persist deletion to local cache
    try {
      const cachedRaw = localStorage.getItem(CACHE_PTS_KEY)
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw)
        cached.kelasGroups = prevKelasGroups.map(group => {
          if (group.kelasId !== siswa.kelasId) return group
          return {
            ...group,
            siswa: group.siswa.map(item => {
              if (item.id !== siswa.id) return item
              return { ...item, hasPts: false, pts: null }
            })
          }
        })
        localStorage.setItem(CACHE_PTS_KEY, JSON.stringify(cached))
      }
    } catch {}

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setDeletingIds(prev => ({ ...prev, [siswa.id]: false }))
      return
    }

    try {
      const res = await fetch(`/api/guru/ujian-pts?id=${siswa.pts?.id || ''}&siswaId=${siswa.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Gagal menghapus nilai')
      }
    } catch (err: any) {
      // If network fails on delete, warn user
      console.warn(`Gagal menghapus di server: ${err.message}`)
    } finally {
      setDeletingIds(prev => ({ ...prev, [siswa.id]: false }))
    }
  }

  const judulHalaman = ptsSettings.judulUjian || 'Ujian Tengah Semester (PTS)'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '90px' }}>
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        color: 'white',
        padding: '24px 20px 20px',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <button
            onClick={() => router.push('/guru/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 12px',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Kembali
          </button>
          <div style={{
            background: ptsSettings.enabled ? 'rgba(234, 179, 8, 0.25)' : 'rgba(239, 68, 68, 0.25)',
            border: ptsSettings.enabled ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            color: ptsSettings.enabled ? '#fef08a' : '#fca5a5',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}>
            {ptsSettings.enabled ? `📅 ${ptsSettings.dateLabel.toUpperCase()}` : '🔒 AKSES DITUTUP'}
          </div>
        </div>

        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>
          {judulHalaman}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#93c5fd', lineHeight: 1.4 }}>
          Input nilai ujian & centang Tasmi&apos; santri halaqah ({activeSemester?.tahunAjaran || '2026/2027'} - {activeSemester?.nama || 'Ganjil'}).
        </p>

        {/* PROGRESS CARD */}
        <div style={{
          marginTop: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          borderRadius: '14px',
          padding: '12px 14px',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>Progress Penilaian</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{persenSelesai}%</span>
          </div>
          <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${persenSelesai}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)',
              borderRadius: '10px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#cbd5e1' }}>
            <span>Total: <b>{totalAllSiswa}</b> Santri</span>
            <span style={{ color: '#86efac' }}>Sudah Dinilai: <b>{totalSudahUjian}</b></span>
            <span style={{ color: '#fca5a5' }}>Belum: <b>{totalBelumUjian}</b></span>
          </div>
        </div>
      </div>

      {/* ALERT AKSES DITUTUP */}
      {!ptsSettings.enabled && (
        <div style={{
          margin: '14px 16px 0',
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '14px',
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.06)'
        }}>
          <div style={{ fontSize: '24px' }}>🔒</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px' }}>Akses Penginputan Nilai Ditutup</div>
            <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px', lineHeight: 1.4 }}>
              Admin telah menutup sesi penginputan nilai ujian. Anda hanya dapat meninjau data nilai santri (Read-Only).
            </div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div style={{ padding: '16px 16px 8px' }}>
        {/* Search */}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Cari nama santri binaan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: 'white',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Kelas Pill Filter */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          <button
            onClick={() => setSelectedKelas('SEMUA')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: selectedKelas === 'SEMUA' ? '#1e3a8a' : '#e2e8f0',
              color: selectedKelas === 'SEMUA' ? 'white' : '#475569'
            }}
          >
            Semua ({allSiswa.length})
          </button>
          {kelasGroups.map(k => (
            <button
              key={k.kelasId}
              onClick={() => setSelectedKelas(k.kelasId)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: selectedKelas === k.kelasId ? '#1e3a8a' : '#e2e8f0',
                color: selectedKelas === k.kelasId ? 'white' : '#475569'
              }}
            >
              Kelas {k.kelasNama} ({k.totalSiswa})
            </button>
          ))}
        </div>
      </div>

      {/* DAFTAR SISWA */}
      <div style={{ padding: '8px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <div>Memuat data santri halaqah...</div>
          </div>
        ) : filteredSiswa.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px 20px',
            textAlign: 'center',
            color: '#64748b',
            border: '1px dashed #cbd5e1'
          }}>
            Tidak ada santri yang ditemukan.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredSiswa.map((s, idx) => {
              const isTasmiChecked = !!tasmis[s.id]
              const isSaving = !!savingIds[s.id]
              const isSaved = !!savedSuccessIds[s.id]

              return (
                <div
                  key={s.id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: s.hasPts ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    transition: 'border 0.3s ease'
                  }}
                >
                  {/* Left Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: s.hasPts ? '#dcfce7' : '#f1f5f9',
                      color: s.hasPts ? '#166534' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      flexShrink: 0
                    }}>
                      {getInitials(s.nama)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {s.nama}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontWeight: 600 }}>Kelas {s.kelas}</span>
                        <span>•</span>
                        <span>NIS: {s.nis || '-'}</span>
                      </div>

                      {/* Status Badges */}
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {s.hasPts ? (
                          <>
                            <span style={{
                              background: '#dcfce7',
                              color: '#15803d',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              ✓ Nilai: {s.pts?.nilaiAkhir} ({s.pts?.predikat})
                            </span>
                            {s.pts?.isTasmi && (
                              <span style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}>
                                ⭐ Tasmi&apos;
                              </span>
                            )}
                            {offlineQueuedIds[s.id] && (
                              <span style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: '1px dashed #f59e0b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                ⏳ Menunggu Sync
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{
                            background: '#fef3c7',
                            color: '#b45309',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            Belum Ujian
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: View Mode vs Edit/Input Mode */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0,
                    marginLeft: 'auto'
                  }}>
                    {s.hasPts && !editingIds[s.id] ? (
                      /* VIEW MODE: Tampilan rapi, aman dari salah senggol, ada tombol Edit & Hapus */
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => {
                            if (!ptsSettings.enabled) return
                            setEditingIds(prev => ({ ...prev, [s.id]: true }))
                            setTimeout(() => {
                              inputRefs.current[s.id]?.focus()
                              inputRefs.current[s.id]?.select()
                            }, 50)
                          }}
                          disabled={!ptsSettings.enabled}
                          style={{
                            background: ptsSettings.enabled ? '#eff6ff' : '#f1f5f9',
                            color: ptsSettings.enabled ? '#1e3a8a' : '#94a3b8',
                            border: ptsSettings.enabled ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                            padding: '7px 14px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: ptsSettings.enabled ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          ✏️ Edit Nilai
                        </button>

                        {/* TOMBOL HAPUS NILAI */}
                        <button
                          onClick={() => handleDeleteRow(s)}
                          disabled={!ptsSettings.enabled || !!deletingIds[s.id]}
                          title="Hapus nilai ujian siswa ini"
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            padding: '7px 10px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: (!ptsSettings.enabled || !!deletingIds[s.id]) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {deletingIds[s.id] ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    ) : (
                      /* EDIT / INPUT MODE: Form cepat input nilai + tasmi + simpan + batal */
                      <>
                        {/* OPSI TASMI' */}
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '7px 10px',
                          borderRadius: '10px',
                          background: isTasmiChecked ? '#fef3c7' : '#f8fafc',
                          border: isTasmiChecked ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
                          color: isTasmiChecked ? '#92400e' : '#64748b',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: ptsSettings.enabled ? 'pointer' : 'not-allowed',
                          userSelect: 'none',
                          transition: 'all 0.15s ease'
                        }}>
                          <input
                            type="checkbox"
                            disabled={!ptsSettings.enabled}
                            checked={isTasmiChecked}
                            onChange={e => setTasmis(prev => ({ ...prev, [s.id]: e.target.checked }))}
                            style={{ accentColor: '#d97706', cursor: ptsSettings.enabled ? 'pointer' : 'not-allowed' }}
                          />
                          <span>Tasmi&apos;</span>
                        </label>

                        {/* KOLOM INPUT NILAI */}
                        <input
                          ref={el => { inputRefs.current[s.id] = el }}
                          type="number"
                          min={0}
                          max={100}
                          disabled={!ptsSettings.enabled}
                          placeholder="Nilai"
                          value={scores[s.id] ?? ''}
                          onChange={e => setScores(prev => ({ ...prev, [s.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveRow(s, idx)
                            }
                          }}
                          style={{
                            width: '65px',
                            padding: '8px 4px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '14px',
                            outline: 'none',
                            background: !ptsSettings.enabled ? '#f1f5f9' : 'white',
                            color: '#0f172a',
                            boxSizing: 'border-box'
                          }}
                        />

                        {/* TOMBOL SIMPAN / UPDATE */}
                        <button
                          onClick={() => handleSaveRow(s, idx)}
                          disabled={!ptsSettings.enabled || isSaving}
                          style={{
                            background: isSaved
                              ? '#10b981'
                              : (!ptsSettings.enabled ? '#cbd5e1' : '#1e3a8a'),
                            color: 'white',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: (!ptsSettings.enabled || isSaving) ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                            minWidth: '65px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: ptsSettings.enabled && !isSaved ? '0 2px 6px rgba(30, 58, 138, 0.2)' : 'none'
                          }}
                        >
                          {isSaved ? '✓ OK' : isSaving ? '...' : (s.hasPts ? 'Update' : 'Simpan')}
                        </button>

                        {/* TOMBOL BATAL (hanya saat mode edit santri yang sudah punya nilai) */}
                        {s.hasPts && editingIds[s.id] && (
                          <button
                            onClick={() => {
                              // Revert value back to existing pts
                              setScores(prev => ({ ...prev, [s.id]: String(s.pts?.nilaiAkhir ?? '') }))
                              setTasmis(prev => ({ ...prev, [s.id]: !!s.pts?.isTasmi }))
                              setEditingIds(prev => ({ ...prev, [s.id]: false }))
                            }}
                            title="Batal edit"
                            style={{
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                              padding: '8px 10px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MOBILE NAV BOTTOM */}
      <MobileNav role="guru" />
    </div>
  )
}
