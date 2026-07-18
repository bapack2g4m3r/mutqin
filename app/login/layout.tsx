import NextAuthProvider from '@/components/providers/NextAuthProvider'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — MUTQIN',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <NextAuthProvider>{children}</NextAuthProvider>
}
