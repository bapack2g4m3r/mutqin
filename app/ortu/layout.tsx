import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NextAuthProvider from '@/components/providers/NextAuthProvider'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orang Tua — MUTQIN' }

export default async function OrtuLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const role = (session.user as any).role
  if (role !== 'ORTU') {
    if (role === 'ADMIN') redirect('/admin/dashboard')
    if (role === 'GURU') redirect('/guru/dashboard')
    redirect('/login')
  }
  return <NextAuthProvider>{children}</NextAuthProvider>
}
