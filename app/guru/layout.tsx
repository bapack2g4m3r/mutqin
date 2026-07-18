import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NextAuthProvider from '@/components/providers/NextAuthProvider'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Guru — MUTQIN' }

export default async function GuruLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const role = (session.user as any).role
  if (role !== 'GURU') {
    if (role === 'ADMIN') redirect('/admin/dashboard')
    if (role === 'ORTU') redirect('/ortu/dashboard')
    redirect('/login')
  }
  return <NextAuthProvider>{children}</NextAuthProvider>
}
