'use client'

import { useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'

export function IdleTimer({ timeoutMs = 900000 }: { timeoutMs?: number }) { // Default: 15 menit
  const { status } = useSession()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return

    const handleActivity = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        // Logout otomatis ketika idle
        signOut({ callbackUrl: '/login?idle=true' })
      }, timeoutMs)
    }

    // Pasang timer awal
    handleActivity()

    // Event listener untuk mendeteksi aktivitas user
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart']
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }))

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      events.forEach(event => window.removeEventListener(event, handleActivity))
    }
  }, [status, timeoutMs])

  return null
}
