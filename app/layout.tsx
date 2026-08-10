import type { Metadata } from 'next'
import './globals.css'
import NextAuthProvider from '@/components/providers/NextAuthProvider'
import { PingTracker } from '@/components/PingTracker'
import { IdleTimer } from '@/components/IdleTimer'
import { OfflineSyncManager } from '@/components/OfflineSyncManager'

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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a8a" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </head>
      <body>
        <NextAuthProvider>
          <PingTracker />
          <IdleTimer />
          <OfflineSyncManager />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
