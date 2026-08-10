'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Offline → skip auth check, render children directly
  if (isOffline) return <>{children}</>

  // Loading session
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f0f4f8',
      }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid #e2e8f0',
          borderTopColor: '#1e3a8a', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  // Not authenticated → redirect to login
  if (!session) {
    if (typeof window !== 'undefined') window.location.href = '/login'
    return null
  }

  // Wrong role → redirect
  const role = (session.user as any)?.role
  if (role !== 'GURU') {
    if (typeof window !== 'undefined') {
      if (role === 'ADMIN') window.location.href = '/admin/dashboard'
      else if (role === 'ORTU') window.location.href = '/ortu/dashboard'
      else window.location.href = '/login'
    }
    return null
  }

  return <>{children}</>
}

