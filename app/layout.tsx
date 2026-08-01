import type { Metadata } from 'next'
import './globals.css'
import NextAuthProvider from '@/components/providers/NextAuthProvider'
import { PingTracker } from '@/components/PingTracker'
import { IdleTimer } from '@/components/IdleTimer'

export const metadata: Metadata = {
  title: 'MUTQIN — Sistem Administrasi Tahfidz & Tahsin | SMP Global Insani',
  description: 'Sistem administrasi digital Tahfidz dan Tahsin untuk SMP Global Insani School. Mudah, cepat, dan akurat.',
  keywords: 'tahfidz, tahsin, administrasi, quran, sekolah islam, global insani',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <NextAuthProvider>
          <PingTracker />
          <IdleTimer />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
