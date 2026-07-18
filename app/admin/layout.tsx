import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NextAuthProvider from '@/components/providers/NextAuthProvider'
import AdminSidebar from '@/components/layout/AdminSidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — MUTQIN' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const role = (session.user as any).role
  if (role !== 'ADMIN') {
    if (role === 'GURU') redirect('/guru/dashboard')
    if (role === 'ORTU') redirect('/ortu/dashboard')
    redirect('/login')
  }
  return (
    <NextAuthProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff' }}>
        <AdminSidebar userName={session.user?.name || 'Admin'} />
        <main style={{ flex: 1, marginLeft: '260px', minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    </NextAuthProvider>
  )
}
