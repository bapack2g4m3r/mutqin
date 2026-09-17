'use client'

import { useEffect, useState, useCallback } from 'react'

export function PWAUpdateManager() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleApplyUpdate = useCallback(() => {
    setIsUpdating(true)
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    // Beri waktu 300ms untuk aktivasi lalu refresh halaman secara bersih
    setTimeout(() => {
      window.location.reload()
    }, 300)
  }, [registration])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let refreshing = false
    // Reload saat controller berubah untuk memastikan bundle terbaru aktif
    const handleControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker.ready.then(reg => {
      setRegistration(reg)

      // 1. Cek jika sudah ada worker yang 'waiting'
      if (reg.waiting) {
        setUpdateAvailable(true)
      }

      // 2. Cek update ketika ada worker baru yang ditemukan
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          // Jika sudah terinstall dan ada controller aktif sebelumnya -> ini adalah versi update!
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true)
          }
        })
      })

      // 3. Proactive update check saat tab dibuka kembali atau koneksi kembali
      const checkUpdate = () => {
        reg.update().catch(() => {})
      }

      window.addEventListener('focus', checkUpdate)
      window.addEventListener('online', checkUpdate)

      // Listener untuk event manual dari OfflineReadyManager
      const handleManualCheck = async (e: Event) => {
        try {
          const customEvent = e as CustomEvent
          await reg.update()
          if (reg.waiting) {
            setUpdateAvailable(true)
            customEvent.detail?.onResult?.(true)
          } else {
            customEvent.detail?.onResult?.(false)
          }
        } catch {
          // Silent catch
        }
      }

      window.addEventListener('mutqin:check-update', handleManualCheck)

      return () => {
        window.removeEventListener('focus', checkUpdate)
        window.removeEventListener('online', checkUpdate)
        window.removeEventListener('mutqin:check-update', handleManualCheck)
      }
    })

    // 4. Listener pesan broadcast dari Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        setUpdateAvailable(true)
      }
    }
    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  if (!updateAvailable) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '440px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '14px 16px',
        boxShadow: '0 8px 24px rgba(30, 58, 138, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
          }}
        >
          🚀
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '-0.2px' }}>
            Pembaruan Aplikasi Tersedia
          </div>
          <div style={{ fontSize: '11px', color: '#bfdbfe', marginTop: '2px', lineHeight: 1.3 }}>
            Fitur terbaru MUTQIN siap digunakan.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          id="btn-update-pwa-now"
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          style={{
            background: '#fef08a',
            color: '#854d0e',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: isUpdating ? 'wait' : 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'transform 0.15s ease',
          }}
        >
          {isUpdating ? (
            <>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid #854d0e',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }}
              />
              Memuat...
            </>
          ) : (
            'Perbarui'
          )}
        </button>

        <button
          onClick={() => setUpdateAvailable(false)}
          title="Tutup notifikasi"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#bfdbfe',
            fontSize: '16px',
            padding: '4px',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
