'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

const OFFLINE_QUEUE_KEY = 'mutqin_offline_queue'
const OFFLINE_PTS_QUEUE_KEY = 'mutqin_offline_pts_queue'

interface QueueItem {
  id: number | string
  body: any
  savedAt: string
}

async function flushSetoranQueue(): Promise<number> {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return 0
    const queue: QueueItem[] = JSON.parse(raw)
    if (queue.length === 0) return 0

    const results = await Promise.allSettled(
      queue.map(item =>
        fetch('/api/setoran', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body),
        })
      )
    )

    const failed = queue.filter((_, i) => results[i].status === 'rejected' || (results[i] as PromiseFulfilledResult<Response>).value?.ok === false)
    if (failed.length > 0) {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed))
    } else {
      localStorage.removeItem(OFFLINE_QUEUE_KEY)
    }

    return queue.length - failed.length
  } catch {
    return 0
  }
}

async function flushPtsQueue(): Promise<number> {
  try {
    const raw = localStorage.getItem(OFFLINE_PTS_QUEUE_KEY)
    if (!raw) return 0
    const queue: QueueItem[] = JSON.parse(raw)
    if (queue.length === 0) return 0

    const results = await Promise.allSettled(
      queue.map(item =>
        fetch('/api/guru/ujian-pts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body),
        })
      )
    )

    const failed = queue.filter((_, i) => results[i].status === 'rejected' || (results[i] as PromiseFulfilledResult<Response>).value?.ok === false)
    if (failed.length > 0) {
      localStorage.setItem(OFFLINE_PTS_QUEUE_KEY, JSON.stringify(failed))
    } else {
      localStorage.removeItem(OFFLINE_PTS_QUEUE_KEY)
    }

    return queue.length - failed.length
  } catch {
    return 0
  }
}

export function OfflineSyncManager() {
  const { status } = useSession()
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSetoran, setPendingSetoran] = useState(0)
  const [pendingPts, setPendingPts] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null)

  const updatePendingCount = useCallback(() => {
    try {
      const rawSetoran = localStorage.getItem(OFFLINE_QUEUE_KEY)
      const qSetoran = rawSetoran ? JSON.parse(rawSetoran) : []
      setPendingSetoran(qSetoran.length)
    } catch {
      setPendingSetoran(0)
    }

    try {
      const rawPts = localStorage.getItem(OFFLINE_PTS_QUEUE_KEY)
      const qPts = rawPts ? JSON.parse(rawPts) : []
      setPendingPts(qPts.length)
    } catch {
      setPendingPts(0)
    }
  }, [])

  const handleFlushAll = useCallback(async () => {
    if (!navigator.onLine || syncing) return
    setSyncing(true)

    const [sentSetoran, sentPts] = await Promise.all([
      flushSetoranQueue(),
      flushPtsQueue(),
    ])

    setSyncing(false)
    updatePendingCount()

    const totalSent = sentSetoran + sentPts
    if (totalSent > 0) {
      const parts = []
      if (sentSetoran > 0) parts.push(`${sentSetoran} setoran`)
      if (sentPts > 0) parts.push(`${sentPts} nilai ujian PTS`)
      setSyncSuccessMsg(`✅ ${parts.join(' & ')} berhasil terkirim!`)
      setTimeout(() => setSyncSuccessMsg(null), 4000)
    }
  }, [syncing, updatePendingCount])

  useEffect(() => {
    if (status !== 'authenticated') return
    setIsOnline(navigator.onLine)
    updatePendingCount()

    const handleOnline = () => {
      setIsOnline(true)
      updatePendingCount()
      handleFlushAll()
    }

    const handleOffline = () => {
      setIsOnline(false)
      updatePendingCount()
    }

    const handleStorage = () => updatePendingCount()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('storage', handleStorage)

    if (navigator.onLine) {
      handleFlushAll()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('storage', handleStorage)
    }
  }, [status, updatePendingCount, handleFlushAll])

  if (status !== 'authenticated') return null

  const totalPending = pendingSetoran + pendingPts

  // Sembunyikan jika online dan tidak ada pending dan tidak ada sync notification
  if (isOnline && totalPending === 0 && !syncSuccessMsg && !syncing) return null

  if (syncSuccessMsg) {
    return (
      <div style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        background: '#059669', color: 'white', borderRadius: '12px', padding: '10px 20px',
        fontSize: '13px', fontWeight: 600, zIndex: 9999,
        boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
        display: 'flex', alignItems: 'center', gap: '8px',
        animation: 'slideUp 0.3s ease',
        whiteSpace: 'nowrap',
      }}>
        {syncSuccessMsg}
      </div>
    )
  }

  if (!isOnline || totalPending > 0) {
    return (
      <div style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        background: !isOnline ? '#92400e' : '#d97706',
        color: 'white', borderRadius: '12px', padding: '10px 20px',
        fontSize: '13px', fontWeight: 600, zIndex: 9999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', gap: '8px',
        whiteSpace: 'nowrap',
      }}>
        {syncing ? (
          <>⏳ Mengirim {totalPending} data offline...</>
        ) : !isOnline ? (
          <>📵 Offline{totalPending > 0 ? ` · ${totalPending} data menunggu` : ''}</>
        ) : (
          <>📤 {totalPending} data belum terkirim</>
        )}
      </div>
    )
  }

  return null
}
