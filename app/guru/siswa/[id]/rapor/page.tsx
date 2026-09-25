'use client'

import { useParams } from 'next/navigation'
import RaporPrintView from '@/components/rapor/RaporPrintView'

export default function GuruRaporPrintPage() {
  const params = useParams()
  const id = (Array.isArray(params?.id) ? params?.id[0] : params?.id) as string

  if (!id) return null

  return <RaporPrintView siswaId={id} />
}
