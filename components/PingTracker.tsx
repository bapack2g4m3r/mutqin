'use client'
import { useEffect } from 'react'

export function PingTracker() {
  useEffect(() => {
    const ping = () => {
      // Hanya ping jika tab browser sedang aktif
      if (document.visibilityState === 'visible') {
        fetch('/api/user/ping', { method: 'POST' }).catch(() => {})
      }
    }

    // Ping pertama saat komponen dimount
    ping()

    // Ping setiap 1 menit
    const interval = setInterval(ping, 60 * 1000)

    // Ping ketika tab kembali difokuskan
    document.addEventListener('visibilitychange', ping)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', ping)
    }
  }, [])

  return null
}
