import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const role = (session.user as any).role
  if (role === 'ADMIN') redirect('/admin/dashboard')
  if (role === 'GURU') redirect('/guru/dashboard')
  if (role === 'ORTU') redirect('/ortu/dashboard')

  redirect('/login')
}
