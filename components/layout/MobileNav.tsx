'use client'
import { usePathname, useRouter } from 'next/navigation'

interface MobileNavProps {
  role: 'guru' | 'ortu'
}

export default function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  // ─── GURU NAV: 4 items with FAB "Setoran" in the center ─────────────────
  if (role === 'guru') {
    const isSetoranActive = pathname.includes('/setoran')

    return (
      <nav className="bottom-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Beranda */}
        <button
          id="nav-beranda"
          className={`bottom-nav-item ${pathname === '/guru/dashboard' || pathname.startsWith('/guru/dashboard') ? 'active' : ''}`}
          onClick={() => router.push('/guru/dashboard')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          <span>Beranda</span>
        </button>

        {/* Siswa */}
        <button
          id="nav-siswa"
          className={`bottom-nav-item ${pathname.startsWith('/guru/siswa') ? 'active' : ''}`}
          onClick={() => router.push('/guru/siswa')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Siswa</span>
        </button>

        {/* ── FAB: SETORAN (tengah, menonjol ke atas) ── */}
        <div className="bottom-nav-fab-wrap">
          <button
            id="nav-setoran-fab"
            className={`bottom-nav-fab ${isSetoranActive ? 'active-page' : ''}`}
            onClick={() => router.push('/guru/siswa')}
            aria-label="Input Setoran"
          >
            {/* Quran / pencil icon */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <span className="bottom-nav-fab-label" style={{ color: isSetoranActive ? 'var(--color-accent-700)' : 'var(--color-primary-700)' }}>
            Setoran
          </span>
        </div>

        {/* Riwayat */}
        <button
          id="nav-riwayat"
          className={`bottom-nav-item ${pathname.startsWith('/guru/riwayat') ? 'active' : ''}`}
          onClick={() => router.push('/guru/riwayat')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>Riwayat</span>
        </button>

        {/* Profil */}
        <button
          id="nav-profil"
          className={`bottom-nav-item ${pathname.startsWith('/guru/profil') ? 'active' : ''}`}
          onClick={() => router.push('/guru/profil')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Profil</span>
        </button>
      </nav>
    )
  }

  // ─── ORTU NAV: simple 3-item nav ────────────────────────────────────────
  const ortuItems = [
    {
      id: 'nav-ortu-beranda', href: '/ortu/dashboard', label: 'Beranda',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
    },
    {
      id: 'nav-ortu-riwayat', href: '/ortu/riwayat', label: 'Riwayat',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      id: 'nav-ortu-profil', href: '/ortu/profil', label: 'Profil',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ]

  return (
    <nav className="bottom-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {ortuItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <button
            key={item.id}
            id={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => router.push(item.href)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
