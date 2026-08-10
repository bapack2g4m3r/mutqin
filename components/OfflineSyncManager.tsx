'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const OFFLINE_QUEUE_KEY = 'mutqin_offline_queue'

interface QueueItem {
  id: number
  body: any
  savedAt: string
}

async function flushQueue() {
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

    // Simpan yang gagal untuk dicoba lagi nanti
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

export function OfflineSyncManager() {
  const { status } = useSession()
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(0)

  function updatePendingCount() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
      const queue: QueueItem[] = raw ? JSON.parse(raw) : []
      setPendingCount(queue.length)
    } catch {
      setPendingCount(0)
    }
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    setIsOnline(navigator.onLine)
    updatePendingCount()

    const handleOnline = async () => {
      setIsOnline(true)
      updatePendingCount()
      // Coba flush queue saat kembali online
      const pending = localStorage.getItem(OFFLINE_QUEUE_KEY)
      if (pending && JSON.parse(pending).length > 0) {
        setSyncing(true)
        const sent = await flushQueue()
        setSyncing(false)
        if (sent > 0) {
          setSyncSuccess(sent)
          updatePendingCount()
          setTimeout(() => setSyncSuccess(0), 4000)
        }
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      updatePendingCount()
    }

    // Listen for storage changes (when setoran page adds to queue)
    const handleStorage = () => updatePendingCount()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('storage', handleStorage)

    // Coba sync saat pertama mount (jika ada antrian pending)
    if (navigator.onLine) handleOnline()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('storage', handleStorage)
    }
  }, [status])

  if (status !== 'authenticated') return null

  // Sembunyikan jika online dan tidak ada pending dan tidak ada sync notification
  if (isOnline && pendingCount === 0 && syncSuccess === 0 && !syncing) return null

  if (syncSuccess > 0) {
    return (
      <div style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        background: '#059669', color: 'white', borderRadius: '12px', padding: '10px 20px',
        fontSize: '13px', fontWeight: 600, zIndex: 9999,
        boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
        display: 'flex', alignItems: 'center', gap: '8px',
        animation: 'slideUp 0.3s ease',
      }}>
        ✅ {syncSuccess} setoran offline berhasil terkirim!
      </div>
    )
  }

  if (!isOnline || pendingCount > 0) {
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
          <>⏳ Mengirim {pendingCount} setoran offline...</>
        ) : !isOnline ? (
          <>📵 Offline{pendingCount > 0 ? ` · ${pendingCount} setoran menunggu` : ''}</>
        ) : (
          <>📤 {pendingCount} setoran belum terkirim</>
        )}
      </div>
    )
  }

  return null
}
