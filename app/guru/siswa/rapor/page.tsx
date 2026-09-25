'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import RaporPrintView from '@/components/rapor/RaporPrintView'

function GuruRaporQueryContent() {
  const searchParams = useSearchParams()
  const idFromUrl = searchParams.get('id')
  const [resolvedId, setResolvedId] = useState<string>(idFromUrl || '')

  useEffect(() => {
    if (idFromUrl) {
      setResolvedId(idFromUrl)
    } else if (typeof window !== 'undefined' && !navigator.onLine) {
      const offlineId = localStorage.getItem('offline_nav_detail_id') || ''
      if (offlineId) setResolvedId(offlineId)
    }
  }, [idFromUrl])

  if (!resolvedId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Pilih santri terlebih dahulu untuk mencetak rapor.
      </div>
    )
  }

  return <RaporPrintView siswaId={resolvedId} />
}

export default function GuruRaporQueryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Memuat...</div>}>
      <GuruRaporQueryContent />
    </Suspense>
  )
}
