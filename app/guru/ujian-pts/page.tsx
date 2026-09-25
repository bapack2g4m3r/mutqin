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
    nilai?: number
    nilaiTahfidz?: number
    nilaiTahsin?: number
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
  hasPtsTahfidz?: boolean
  hasPtsTahsin?: boolean
  pts: {
    id: string
    jenis: string
    isTasmi?: boolean
    nilaiAkhir: number
    predikat: string
    catatan?: string | null
    tanggal: string
  } | null
  ptsTahfidz?: {
    id: string
    jenis: string
    isTasmi?: boolean
    nilaiAkhir: number
    predikat: string
    catatan?: string | null
    tanggal: string
  } | null
  ptsTahsin?: {
    id: string
    jenis: string
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
  sudahUjianTahfidzCount?: number
  sudahUjianTahsinCount?: number
  siswa: SiswaPtsItem[]
}

function getInitials(nama: string) {
  return nama.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// Feature flag: set ke true jika sudah siap mengaktifkan input nilai ujian Tahsin di masa mendatang
const SHOW_TAHSIN_INPUT = false

export default function GuruUjianPtsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kelasGroups, setKelasGroups] = useState<KelasGroup[]>([])
  const [selectedKelas, setSelectedKelas] = useState<string>('SEMUA')
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | 'BELUM' | 'BELUM_TAHSIN' | 'BELUM_TAHFIDZ' | 'SUDAH'>('SEMUA')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSemester, setActiveSemester] = useState<{ id: string; nama: string; tahunAjaran: string } | null>(null)
  const [ptsSettings, setPtsSettings] = useState<{ enabled: boolean; dateLabel: string; tipeUjian?: string; judulUjian?: string }>({
    enabled: true,
    dateLabel: '21 - 23 September 2026',
    tipeUjian: 'PTS',
    judulUjian: 'Penilaian Tengah Semester (PTS)'
  })

  // State per baris siswa (Tahfidz & Tahsin)
  const [scoresTahfidz, setScoresTahfidz] = useState<Record<string, string>>({})
  const [scoresTahsin, setScoresTahsin] = useState<Record<string, string>>({})
  const [tasmis, setTasmis] = useState<Record<string, boolean>>({})
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({})
  const [savedSuccessIds, setSavedSuccessIds] = useState<Record<string, boolean>>({})
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({})
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({})
  const [offlineQueuedIds, setOfflineQueuedIds] = useState<Record<string, boolean>>({})

  // Input refs for auto-focus next student on Enter
  const inputRefsTahfidz = useRef<Record<string, HTMLInputElement | null>>({})
  const inputRefsTahsin = useRef<Record<string, HTMLInputElement | null>>({})

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

          const initialScoresTahfidz: Record<string, string> = {}
          const initialScoresTahsin: Record<string, string> = {}
          const initialTasmis: Record<string, boolean> = {}
          cached.kelasGroups?.forEach((g: KelasGroup) => {
            g.siswa.forEach(s => {
              if (s.ptsTahfidz) {
                initialScoresTahfidz[s.id] = String(s.ptsTahfidz.nilaiAkhir ?? '')
                initialTasmis[s.id] = !!s.ptsTahfidz.isTasmi
              } else if (s.pts?.jenis === 'TAHFIDZ') {
                initialScoresTahfidz[s.id] = String(s.pts.nilaiAkhir ?? '')
                initialTasmis[s.id] = !!s.pts.isTasmi
              }

              if (s.ptsTahsin) {
                initialScoresTahsin[s.id] = String(s.ptsTahsin.nilaiAkhir ?? '')
              } else if (s.pts?.jenis === 'TAHSIN') {
                initialScoresTahsin[s.id] = String(s.pts.nilaiAkhir ?? '')
              }
            })
          })
          setScoresTahfidz(prev => ({ ...initialScoresTahfidz, ...prev }))
          setScoresTahsin(prev => ({ ...initialScoresTahsin, ...prev }))
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
        const initialScoresTahfidz: Record<string, string> = {}
        const initialScoresTahsin: Record<string, string> = {}
        const initialTasmis: Record<string, boolean> = {}
        data.kelasGroups?.forEach((g: KelasGroup) => {
          g.siswa.forEach(s => {
            if (s.ptsTahfidz) {
              initialScoresTahfidz[s.id] = String(s.ptsTahfidz.nilaiAkhir ?? '')
              initialTasmis[s.id] = !!s.ptsTahfidz.isTasmi
            } else if (s.pts?.jenis === 'TAHFIDZ') {
              initialScoresTahfidz[s.id] = String(s.pts.nilaiAkhir ?? '')
              initialTasmis[s.id] = !!s.pts.isTasmi
            }

            if (s.ptsTahsin) {
              initialScoresTahsin[s.id] = String(s.ptsTahsin.nilaiAkhir ?? '')
            } else if (s.pts?.jenis === 'TAHSIN') {
              initialScoresTahsin[s.id] = String(s.pts.nilaiAkhir ?? '')
            }
          })
        })
        setScoresTahfidz(prev => ({ ...initialScoresTahfidz, ...prev }))
        setScoresTahsin(prev => ({ ...initialScoresTahsin, ...prev }))
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

  // Helper to determine if student has completed exam based on active feature flag
  const isSiswaExamDone = (s: SiswaPtsItem) => SHOW_TAHSIN_INPUT ? s.hasPts : !!s.ptsTahfidz

  const totalAllSiswa = allSiswa.length
  const totalSudahUjian = allSiswa.filter(isSiswaExamDone).length
  const totalBelumUjian = totalAllSiswa - totalSudahUjian
  const persenSelesai = totalAllSiswa > 0 ? Math.round((totalSudahUjian / totalAllSiswa) * 100) : 0

  // Base list of students according to current class selection (for accurate filter counts)
  const baseSiswa = useMemo(() => {
    return selectedKelas === 'SEMUA' ? allSiswa : allSiswa.filter(s => s.kelasId === selectedKelas)
  }, [allSiswa, selectedKelas])

  const countBelumUjian = useMemo(() => baseSiswa.filter(s => !isSiswaExamDone(s)).length, [baseSiswa])
  const countBelumTahsin = useMemo(() => baseSiswa.filter(s => !s.ptsTahsin).length, [baseSiswa])
  const countBelumTahfidz = useMemo(() => baseSiswa.filter(s => !s.ptsTahfidz).length, [baseSiswa])
  const countSudahAdaNilai = useMemo(() => baseSiswa.filter(isSiswaExamDone).length, [baseSiswa])

  // Filtered students by class, search, and status
  const filteredSiswa = useMemo(() => {
    return allSiswa.filter(s => {
      const matchKelas = selectedKelas === 'SEMUA' || s.kelasId === selectedKelas
      const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || (s.nis && s.nis.includes(searchQuery))

      let matchStatus = true
      if (statusFilter === 'BELUM') {
        matchStatus = !isSiswaExamDone(s)
      } else if (statusFilter === 'BELUM_TAHSIN') {
        matchStatus = SHOW_TAHSIN_INPUT && !s.ptsTahsin
      } else if (statusFilter === 'BELUM_TAHFIDZ') {
        matchStatus = !s.ptsTahfidz
      } else if (statusFilter === 'SUDAH') {
        matchStatus = isSiswaExamDone(s)
      }

      return matchKelas && matchSearch && matchStatus
    })
  }, [allSiswa, selectedKelas, searchQuery, statusFilter])

  // OPTIMISTIC SAVE: Instantly updates local UI with 0ms delay, syncs in background
  const handleSaveRow = async (siswa: SiswaPtsItem, currentIndex?: number) => {
    if (!ptsSettings.enabled) return

    const rawTf = scoresTahfidz[siswa.id]
    const rawTs = scoresTahsin[siswa.id]

    const hasTfInput = rawTf !== undefined && rawTf.trim() !== ''
    const hasTsInput = SHOW_TAHSIN_INPUT && rawTs !== undefined && rawTs.trim() !== ''

    if (!hasTfInput && !hasTsInput) {
      alert(`Mohon masukkan angka nilai untuk ${siswa.nama}`)
      return
    }

    let numTf: number | null = null
    if (hasTfInput) {
      numTf = Number(rawTf)
      if (isNaN(numTf) || numTf < 0 || numTf > 100) {
        alert('Nilai Tahfidz harus berupa angka antara 0 sampai 100')
        return
      }
    }

    let numTs: number | null = null
    if (SHOW_TAHSIN_INPUT && hasTsInput) {
      numTs = Number(rawTs)
      if (isNaN(numTs) || numTs < 0 || numTs > 100) {
        alert('Nilai Tahsin harus berupa angka antara 0 sampai 100')
        return
      }
    }

    const isTasmiChecked = !!tasmis[siswa.id]

    // 1. OPTIMISTIC UPDATE: Update UI immediately so the teacher never waits!
    const prevKelasGroups = kelasGroups

    setKelasGroups(prev => prev.map(group => {
      if (group.kelasId !== siswa.kelasId) return group
      const updatedSiswaList = group.siswa.map(item => {
        if (item.id !== siswa.id) return item

        const updatedTahfidz = numTf !== null ? {
          id: item.ptsTahfidz?.id || 'temp-tf-' + item.id,
          jenis: 'TAHFIDZ',
          isTasmi: isTasmiChecked,
          nilaiAkhir: numTf,
          predikat: getPredikat(numTf).label,
          catatan: item.ptsTahfidz?.catatan || null,
          tanggal: new Date().toISOString()
        } : item.ptsTahfidz

        const updatedTahsin = (SHOW_TAHSIN_INPUT && numTs !== null) ? {
          id: item.ptsTahsin?.id || 'temp-ts-' + item.id,
          jenis: 'TAHSIN',
          nilaiAkhir: numTs,
          predikat: getPredikat(numTs).label,
          catatan: item.ptsTahsin?.catatan || null,
          tanggal: new Date().toISOString()
        } : item.ptsTahsin

        return {
          ...item,
          hasPts: SHOW_TAHSIN_INPUT ? !!(updatedTahfidz || updatedTahsin) : !!updatedTahfidz,
          hasPtsTahfidz: !!updatedTahfidz,
          hasPtsTahsin: !!updatedTahsin,
          ptsTahfidz: updatedTahfidz,
          ptsTahsin: updatedTahsin,
          pts: updatedTahfidz || updatedTahsin || null
        }
      })
      return {
        ...group,
        sudahUjianCount: updatedSiswaList.filter(s => SHOW_TAHSIN_INPUT ? s.hasPts : !!s.ptsTahfidz).length,
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

    // 2. AUTO-FOCUS NEXT STUDENT: Automatically open and focus next student's input if not in edit mode
    if (!isSiswaExamDone(siswa) && currentIndex !== undefined && currentIndex + 1 < filteredSiswa.length) {
      const nextSiswa = filteredSiswa[currentIndex + 1]
      setTimeout(() => {
        setEditingIds(prev => ({ ...prev, [nextSiswa.id]: true }))
        setTimeout(() => {
          inputRefsTahfidz.current[nextSiswa.id]?.focus()
          inputRefsTahfidz.current[nextSiswa.id]?.select()
        }, 50)
      }, 50)
    }

    // 3. BACKGROUND SYNC: Send to database or queue locally if offline
    setSavingIds(prev => ({ ...prev, [siswa.id]: true }))
    const payload = {
      siswaId: siswa.id,
      nilaiTahfidz: numTf !== null ? numTf : undefined,
      isTasmi: isTasmiChecked,
      nilaiTahsin: (SHOW_TAHSIN_INPUT && numTs !== null) ? numTs : undefined
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
              const uTf = numTf !== null ? {
                id: item.ptsTahfidz?.id || 'temp-tf-' + item.id,
                jenis: 'TAHFIDZ',
                isTasmi: isTasmiChecked,
                nilaiAkhir: numTf,
                predikat: getPredikat(numTf).label,
                catatan: item.ptsTahfidz?.catatan || null,
                tanggal: new Date().toISOString()
              } : item.ptsTahfidz
              const uTs = (SHOW_TAHSIN_INPUT && numTs !== null) ? {
                id: item.ptsTahsin?.id || 'temp-ts-' + item.id,
                jenis: 'TAHSIN',
                nilaiAkhir: numTs,
                predikat: getPredikat(numTs).label,
                catatan: item.ptsTahsin?.catatan || null,
                tanggal: new Date().toISOString()
              } : item.ptsTahsin
              return {
                ...item,
                hasPts: SHOW_TAHSIN_INPUT ? !!(uTf || uTs) : !!uTf,
                hasPtsTahfidz: !!uTf,
                hasPtsTahsin: !!uTs,
                ptsTahfidz: uTf,
                ptsTahsin: uTs,
                pts: uTf || uTs || null
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
      removeFromOfflinePtsQueue(siswa.id)
      refreshOfflineQueue()

      if (resData.ptsTahfidz || resData.ptsTahsin) {
        setKelasGroups(prev => prev.map(group => {
          if (group.kelasId !== siswa.kelasId) return group
          return {
            ...group,
            siswa: group.siswa.map(item => {
              if (item.id !== siswa.id) return item
              return {
                ...item,
                ptsTahfidz: resData.ptsTahfidz ? { ...item.ptsTahfidz!, id: resData.ptsTahfidz.id } : item.ptsTahfidz,
                ptsTahsin: resData.ptsTahsin ? { ...item.ptsTahsin!, id: resData.ptsTahsin.id } : item.ptsTahsin,
                pts: resData.pts || item.pts
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

  // DELETE EXAM SCORE: Delete exam scores for student
  const handleDeleteRow = async (siswa: SiswaPtsItem) => {
    if (!ptsSettings.enabled) return
    const confirmed = window.confirm(`Apakah antum yakin ingin menghapus nilai ujian untuk ${siswa.nama}? Nilai ujian santri ini akan dihapus dari rapor.`)
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
          hasPtsTahfidz: false,
          hasPtsTahsin: false,
          pts: null,
          ptsTahfidz: null,
          ptsTahsin: null
        }
      })
      return {
        ...group,
        sudahUjianCount: updatedSiswaList.filter(isSiswaExamDone).length,
        siswa: updatedSiswaList
      }
    }))

    // Reset scores & tasmis state
    setScoresTahfidz(prev => ({ ...prev, [siswa.id]: '' }))
    setScoresTahsin(prev => ({ ...prev, [siswa.id]: '' }))
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
              return {
                ...item,
                hasPts: false,
                hasPtsTahfidz: false,
                hasPtsTahsin: false,
                pts: null,
                ptsTahfidz: null,
                ptsTahsin: null
              }
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
      const res = await fetch(`/api/guru/ujian-pts?siswaId=${siswa.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Gagal menghapus nilai')
      }
    } catch (err: any) {
      console.warn(`Gagal menghapus di server: ${err.message}`)
    } finally {
      setDeletingIds(prev => ({ ...prev, [siswa.id]: false }))
    }
  }

  const judulHalaman = ptsSettings.judulUjian || 'Ujian Tengah Semester (PTS)'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '90px' }}>
      {/* RESPONSIVE CSS STYLES FOR MOBILE & DESKTOP */}
      <style>{`
        .pts-card {
          background: white;
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: border 0.3s ease, box-shadow 0.2s ease;
        }

        .pts-student-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .pts-student-name {
          font-weight: 700;
          font-size: 14px;
          color: #0f172a;
          line-height: 1.3;
        }

        .pts-actions-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .pts-view-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .pts-icon-btn {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          padding: 0;
          box-sizing: border-box;
          border: 1.5px solid transparent;
        }
        .pts-icon-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
        }
        .pts-icon-btn:active:not(:disabled) {
          transform: scale(0.94);
        }
        .pts-icon-btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .pts-icon-btn-rapor {
          background: #f0fdf4;
          color: #16a34a;
          border-color: #bbf7d0;
        }
        .pts-icon-btn-rapor:hover {
          background: #dcfce7;
          color: #15803d;
          border-color: #86efac;
        }

        .pts-icon-btn-edit {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
        }
        .pts-icon-btn-edit:hover:not(:disabled) {
          background: #dbeafe;
          color: #1d4ed8;
          border-color: #93c5fd;
        }

        .pts-icon-btn-delete {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }
        .pts-icon-btn-delete:hover:not(:disabled) {
          background: #fee2e2;
          color: #b91c1c;
          border-color: #fca5a5;
        }

        .pts-edit-form {

          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pts-inputs-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pts-input-box-tahfidz {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          padding: 4px 8px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
        }

        .pts-input-box-tahsin {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          padding: 4px 8px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
        }

        .pts-btn-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Desktop Layout (min-width: 769px) */
        @media (min-width: 769px) {
          .pts-student-info {
            flex: 1 1 200px;
          }
          .pts-student-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .pts-actions-wrapper {
            flex-shrink: 0;
            margin-left: auto;
          }
          .pts-edit-form {
            flex-wrap: nowrap;
          }
          .pts-btn-text-mobile {
            display: none !important;
          }
        }

        /* Mobile & Tablet Layout (max-width: 768px) */
        @media (max-width: 768px) {
          .pts-card {
            padding: 12px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .pts-card:not(.pts-card-open) {
            flex-direction: row;
            align-items: center;
            flex-wrap: nowrap;
          }
          .pts-card:not(.pts-card-open) .pts-student-info {
            flex: 1;
            min-width: 0;
          }
          .pts-card:not(.pts-card-open) .pts-actions-wrapper {
            flex-shrink: 0;
            margin-left: auto;
            display: flex;
            justify-content: flex-end;
          }
          .pts-card.pts-card-open {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .pts-card.pts-card-open .pts-student-info {
            width: 100%;
          }
          .pts-card.pts-card-open .pts-actions-wrapper {
            width: 100%;
            margin-left: 0;
          }
          .pts-view-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            margin-left: auto;
            flex-shrink: 0;
          }
          .pts-edit-form {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding-top: 8px;
            border-top: 1px dashed #e2e8f0;
          }
          .pts-inputs-group {
            width: 100%;
            display: flex;
            gap: 8px;
          }
          .pts-input-box-tahfidz {
            flex: 1.25 !important;
            min-width: 0 !important;
            justify-content: space-between !important;
            padding: 4px 6px !important;
          }
          .pts-input-box-tahsin {
            flex: 1 !important;
            min-width: 0 !important;
            justify-content: space-between !important;
            padding: 4px 6px !important;
          }
          .pts-btn-group {
            width: 100%;
            display: flex;
            gap: 8px;
          }
          .pts-btn-submit {
            flex: 1 !important;
            width: 100% !important;
            padding: 10px 16px !important;
            font-size: 13px !important;
          }
          .pts-btn-cancel {
            padding: 10px 14px !important;
            font-size: 13px !important;
          }
          .pts-btn-text-desktop {
            display: none !important;
          }
        }

        @media (max-width: 360px) {
          .pts-inputs-group {
            flex-direction: column;
            gap: 6px;
          }
          .pts-input-box-tahfidz, .pts-input-box-tahsin {
            width: 100%;
          }
        }
      `}</style>

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
            <span
              onClick={() => setStatusFilter('SEMUA')}
              title="Klik untuk tampilkan semua santri"
              style={{
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '6px',
                background: statusFilter === 'SEMUA' ? 'rgba(255,255,255,0.2)' : 'transparent',
                fontWeight: statusFilter === 'SEMUA' ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              Total: <b>{totalAllSiswa}</b> Santri
            </span>
            <span
              onClick={() => setStatusFilter('SUDAH')}
              title="Klik untuk filter yang sudah dinilai"
              style={{
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '6px',
                color: '#86efac',
                background: statusFilter === 'SUDAH' ? 'rgba(134,239,172,0.2)' : 'transparent',
                fontWeight: statusFilter === 'SUDAH' ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              Sudah Dinilai: <b>{totalSudahUjian}</b>
            </span>
            <span
              onClick={() => setStatusFilter('BELUM')}
              title="Klik untuk filter yang belum ujian"
              style={{
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '6px',
                color: '#fca5a5',
                background: statusFilter === 'BELUM' ? 'rgba(252,165,165,0.25)' : 'transparent',
                fontWeight: statusFilter === 'BELUM' ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              Belum: <b>{totalBelumUjian}</b>
            </span>
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

        {/* Status Penilaian Pills */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748b',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Filter Status Ujian</span>
            {statusFilter !== 'SEMUA' && (
              <button
                onClick={() => setStatusFilter('SEMUA')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Reset Status
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setStatusFilter('SEMUA')}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: statusFilter === 'SEMUA' ? '1.5px solid #1e3a8a' : '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: statusFilter === 'SEMUA' ? '#1e3a8a' : 'white',
                color: statusFilter === 'SEMUA' ? 'white' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              Semua ({baseSiswa.length})
            </button>

            <button
              onClick={() => setStatusFilter('BELUM')}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: statusFilter === 'BELUM' ? '1.5px solid #d97706' : '1px solid #fde68a',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: statusFilter === 'BELUM' ? '#d97706' : '#fffbeb',
                color: statusFilter === 'BELUM' ? 'white' : '#b45309',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Belum Ujian</span>
              <span style={{
                background: statusFilter === 'BELUM' ? 'rgba(255,255,255,0.25)' : '#fef3c7',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px'
              }}>
                {countBelumUjian}
              </span>
            </button>

            {SHOW_TAHSIN_INPUT && countBelumTahsin > 0 && countBelumTahsin !== countBelumUjian && (
              <button
                onClick={() => setStatusFilter('BELUM_TAHSIN')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: statusFilter === 'BELUM_TAHSIN' ? '1.5px solid #059669' : '1px solid #a7f3d0',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: statusFilter === 'BELUM_TAHSIN' ? '#059669' : '#ecfdf5',
                  color: statusFilter === 'BELUM_TAHSIN' ? 'white' : '#047857',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Belum Tahsin</span>
                <span style={{
                  background: statusFilter === 'BELUM_TAHSIN' ? 'rgba(255,255,255,0.25)' : '#d1fae5',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {countBelumTahsin}
                </span>
              </button>
            )}

            {countBelumTahfidz > 0 && countBelumTahfidz !== countBelumUjian && (
              <button
                onClick={() => setStatusFilter('BELUM_TAHFIDZ')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: statusFilter === 'BELUM_TAHFIDZ' ? '1.5px solid #2563eb' : '1px solid #bfdbfe',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: statusFilter === 'BELUM_TAHFIDZ' ? '#2563eb' : '#eff6ff',
                  color: statusFilter === 'BELUM_TAHFIDZ' ? 'white' : '#1d4ed8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Belum Tahfidz</span>
                <span style={{
                  background: statusFilter === 'BELUM_TAHFIDZ' ? 'rgba(255,255,255,0.25)' : '#dbeafe',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {countBelumTahfidz}
                </span>
              </button>
            )}

            <button
              onClick={() => setStatusFilter('SUDAH')}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: statusFilter === 'SUDAH' ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: statusFilter === 'SUDAH' ? '#0f172a' : 'white',
                color: statusFilter === 'SUDAH' ? 'white' : '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Sudah Dinilai</span>
              <span style={{
                background: statusFilter === 'SUDAH' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px'
              }}>
                {countSudahAdaNilai}
              </span>
            </button>
          </div>
        </div>

        {/* Kelas Pill Filter */}
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748b',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px'
          }}>
            Filter Kelas
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
            <button
              onClick={() => setSelectedKelas('SEMUA')}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: selectedKelas === 'SEMUA' ? '1.5px solid #1e3a8a' : '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: selectedKelas === 'SEMUA' ? '#1e3a8a' : 'white',
                color: selectedKelas === 'SEMUA' ? 'white' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              Semua ({allSiswa.length})
            </button>
            {kelasGroups.map(k => (
              <button
                key={k.kelasId}
                onClick={() => setSelectedKelas(k.kelasId)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: selectedKelas === k.kelasId ? '1.5px solid #1e3a8a' : '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: selectedKelas === k.kelasId ? '#1e3a8a' : 'white',
                  color: selectedKelas === k.kelasId ? 'white' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                Kelas {k.kelasNama} ({k.totalSiswa})
              </button>
            ))}
          </div>
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
          statusFilter !== 'SEMUA' ? (
            <div style={{
              background: '#f0fdf4',
              borderRadius: '16px',
              padding: '30px 20px',
              textAlign: 'center',
              color: '#166534',
              border: '1.5px dashed #86efac'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>
                Alhamdulillah, Semua Santri Selesai!
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px', maxWidth: '300px', margin: '4px auto 0' }}>
                Tidak ada santri yang belum diinput nilainya pada filter ini.
              </div>
              <button
                onClick={() => setStatusFilter('SEMUA')}
                style={{
                  marginTop: '14px',
                  background: '#166534',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Tampilkan Semua Santri
              </button>
            </div>
          ) : (
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
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredSiswa.map((s, idx) => {
              const isTasmiChecked = !!tasmis[s.id]
              const isSaving = !!savingIds[s.id]
              const isSaved = !!savedSuccessIds[s.id]
              const isInputOpen = !!editingIds[s.id]

              return (
                <div
                  key={s.id}
                  className={`pts-card ${isInputOpen ? 'pts-card-open' : ''}`}
                  style={{
                    border: isSiswaExamDone(s) ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                  }}
                >
                  {/* Left Info */}
                  <div className="pts-student-info">
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: isSiswaExamDone(s) ? '#dcfce7' : '#f1f5f9',
                      color: isSiswaExamDone(s) ? '#166534' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      flexShrink: 0
                    }}>
                      {getInitials(s.nama)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="pts-student-name">
                        {s.nama}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontWeight: 600 }}>Kelas {s.kelas}</span>
                        <span>•</span>
                        <span>NIS: {s.nis || '-'}</span>
                      </div>

                      {/* Status Badges */}
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {isSiswaExamDone(s) ? (
                          <>
                            {s.ptsTahfidz ? (
                              <span style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}>
                                ✓ {SHOW_TAHSIN_INPUT ? 'Tahfidz: ' : 'Nilai: '}{s.ptsTahfidz.nilaiAkhir} ({s.ptsTahfidz.predikat})
                              </span>
                            ) : SHOW_TAHSIN_INPUT ? (
                              <span style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '6px'
                              }}>
                                Tahfidz: Belum
                              </span>
                            ) : null}

                            {s.ptsTahfidz?.isTasmi && (
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

                            {SHOW_TAHSIN_INPUT && (
                              s.ptsTahsin ? (
                                <span style={{
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}>
                                  ✓ Tahsin: {s.ptsTahsin.nilaiAkhir} ({s.ptsTahsin.predikat})
                                </span>
                              ) : (
                                <span style={{
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}>
                                  Tahsin: Belum
                                </span>
                              )
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
                  <div className="pts-actions-wrapper">
                    {!isInputOpen ? (
                      /* VIEW MODE: Tampilan rapi, aman dari salah senggol, ada tombol Edit/Hapus jika ada nilai, atau Input Nilai jika belum */
                      <div className="pts-view-actions">
                        {isSiswaExamDone(s) ? (
                          <>
                            {/* TOMBOL CETAK RAPOR (ICON) */}
                            <a
                              href={`/guru/siswa/${s.id}/rapor`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pts-icon-btn pts-icon-btn-rapor"
                              title="Cetak Rapor Santri (A4)"
                              aria-label="Cetak Rapor"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9"/>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <rect x="6" y="14" width="12" height="8"/>
                              </svg>
                            </a>

                            {/* TOMBOL EDIT NILAI (ICON) */}
                            <button
                              onClick={() => {
                                if (!ptsSettings.enabled) return
                                setEditingIds(prev => ({ ...prev, [s.id]: true }))
                                setTimeout(() => {
                                  inputRefsTahfidz.current[s.id]?.focus()
                                  inputRefsTahfidz.current[s.id]?.select()
                                }, 50)
                              }}
                              disabled={!ptsSettings.enabled}
                              className="pts-icon-btn pts-icon-btn-edit"
                              title="Edit Nilai Ujian"
                              aria-label="Edit Nilai"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                              </svg>
                            </button>

                            {/* TOMBOL HAPUS NILAI (ICON) */}
                            <button
                              onClick={() => handleDeleteRow(s)}
                              disabled={!ptsSettings.enabled || !!deletingIds[s.id]}
                              className="pts-icon-btn pts-icon-btn-delete"
                              title="Hapus Nilai Ujian"
                              aria-label="Hapus Nilai"
                            >
                              {deletingIds[s.id] ? (
                                <span style={{ fontSize: '11px' }}>⏳</span>
                              ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                              )}
                            </button>
                          </>
                        ) : (
                          /* BELUM UJIAN: Tombol Input Nilai yang rapi */
                          <button
                            onClick={() => {
                              if (!ptsSettings.enabled) return
                              setEditingIds(prev => ({ ...prev, [s.id]: true }))
                              setTimeout(() => {
                                inputRefsTahfidz.current[s.id]?.focus()
                                inputRefsTahfidz.current[s.id]?.select()
                              }, 50)
                            }}
                            disabled={!ptsSettings.enabled}
                            style={{
                              background: ptsSettings.enabled ? '#1e3a8a' : '#f1f5f9',
                              color: ptsSettings.enabled ? 'white' : '#94a3b8',
                              border: 'none',
                              padding: '7px 12px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: ptsSettings.enabled ? 'pointer' : 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              transition: 'all 0.15s ease',
                              boxShadow: ptsSettings.enabled ? '0 2px 6px rgba(30, 58, 138, 0.2)' : 'none',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            <span>Input Nilai</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* EDIT / INPUT MODE: Form cepat input nilai Tahfidz & Tahsin + tasmi + simpan + batal */
                      <div className="pts-edit-form">
                        <div className="pts-inputs-group">
                          {/* INPUT TAHFIDZ */}
                          <div className="pts-input-box-tahfidz">
                            {SHOW_TAHSIN_INPUT && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#1e3a8a',
                                letterSpacing: '0.4px',
                                background: '#dbeafe',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                flexShrink: 0
                              }}>
                                TAHFIDZ
                              </span>
                            )}
                            <label style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '2px 5px',
                              borderRadius: '6px',
                              background: isTasmiChecked ? '#fef3c7' : 'white',
                              border: isTasmiChecked ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                              color: isTasmiChecked ? '#92400e' : '#64748b',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: ptsSettings.enabled ? 'pointer' : 'not-allowed',
                              userSelect: 'none',
                              flexShrink: 0
                            }}>
                              <input
                                type="checkbox"
                                disabled={!ptsSettings.enabled}
                                checked={isTasmiChecked}
                                onChange={e => setTasmis(prev => ({ ...prev, [s.id]: e.target.checked }))}
                                style={{ accentColor: '#d97706', cursor: ptsSettings.enabled ? 'pointer' : 'not-allowed', margin: 0 }}
                              />
                              <span>Tasmi&apos;</span>
                            </label>
                            <input
                              ref={el => { inputRefsTahfidz.current[s.id] = el }}
                              type="number"
                              min={0}
                              max={100}
                              disabled={!ptsSettings.enabled}
                              placeholder="Nilai"
                              value={scoresTahfidz[s.id] ?? ''}
                              onChange={e => setScoresTahfidz(prev => ({ ...prev, [s.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleSaveRow(s, idx)
                                }
                              }}
                              style={{
                                width: SHOW_TAHSIN_INPUT ? '50px' : '65px',
                                minWidth: '40px',
                                padding: '5px 4px',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '13px',
                                outline: 'none',
                                background: !ptsSettings.enabled ? '#f1f5f9' : 'white',
                                color: '#0f172a',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          {/* INPUT TAHSIN */}
                          {SHOW_TAHSIN_INPUT && (
                            <div className="pts-input-box-tahsin">
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#047857',
                                letterSpacing: '0.4px',
                                background: '#d1fae5',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                flexShrink: 0
                              }}>
                                TAHSIN
                              </span>
                              <input
                                ref={el => { inputRefsTahsin.current[s.id] = el }}
                                type="number"
                                min={0}
                                max={100}
                                disabled={!ptsSettings.enabled}
                                placeholder="Nilai"
                                value={scoresTahsin[s.id] ?? ''}
                                onChange={e => setScoresTahsin(prev => ({ ...prev, [s.id]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveRow(s, idx)
                                  }
                                }}
                                style={{
                                  width: '50px',
                                  minWidth: '40px',
                                  padding: '5px 2px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #cbd5e1',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '13px',
                                  outline: 'none',
                                  background: !ptsSettings.enabled ? '#f1f5f9' : 'white',
                                  color: '#0f172a',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* TOMBOL AKSI */}
                        <div className="pts-btn-group">
                          {/* TOMBOL BATAL - Selalu ada saat form terbuka (menutup & mereset input) */}
                          <button
                            className="pts-btn-cancel"
                            onClick={() => {
                              setScoresTahfidz(prev => ({ ...prev, [s.id]: String(s.ptsTahfidz?.nilaiAkhir ?? '') }))
                              setScoresTahsin(prev => ({ ...prev, [s.id]: String(s.ptsTahsin?.nilaiAkhir ?? '') }))
                              setTasmis(prev => ({ ...prev, [s.id]: !!s.ptsTahfidz?.isTasmi }))
                              setEditingIds(prev => ({ ...prev, [s.id]: false }))
                            }}
                            title="Batal / Tutup form"
                            style={{
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            ✕ Batal
                          </button>

                          {/* TOMBOL SIMPAN / UPDATE */}
                          <button
                            className="pts-btn-submit"
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
                            <span className="pts-btn-text-desktop">
                              {isSaved ? '✓ OK' : isSaving ? '...' : (isSiswaExamDone(s) ? 'Update' : 'Simpan')}
                            </span>
                            <span className="pts-btn-text-mobile">
                              {isSaved ? '✓ Tersimpan' : isSaving ? 'Menyimpan...' : (isSiswaExamDone(s) ? 'Update Nilai' : 'Simpan Nilai')}
                            </span>
                          </button>
                        </div>
                      </div>
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
