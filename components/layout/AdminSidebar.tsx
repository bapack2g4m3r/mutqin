'use client'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const navItems = [
  {
    id: 'nav-admin-dashboard', href: '/admin/dashboard', label: 'Dashboard', section: 'Menu',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    id: 'nav-admin-siswa', href: '/admin/siswa', label: 'Data Siswa', section: 'Menu',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'nav-admin-guru', href: '/admin/guru', label: 'Data Guru', section: 'Menu',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    id: 'nav-admin-setoran', href: '/admin/setoran', label: 'Setoran', section: 'Menu',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  {
    id: 'nav-admin-laporan', href: '/admin/laporan', label: 'Laporan', section: 'Menu',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    id: 'nav-admin-akademik', href: '/admin/akademik', label: 'Struktur Akademik', section: 'Pengaturan',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  },
]

export default function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M11 3H3v8h8V3z" fill="rgba(255,255,255,0.9)"/>
              <path d="M21 3h-8v8h8V3z" fill="rgba(255,255,255,0.5)"/>
              <path d="M21 13h-8v8h8v-8z" fill="rgba(255,255,255,0.7)"/>
              <path d="M11 13H3v8h8v-8z" fill="rgba(255,255,255,0.3)"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#1e3a8a' }}>MUTQIN</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav — grouped by section */}
      <nav className="sidebar-nav">
        {['Menu', 'Pengaturan'].map(section => {
          const items = navItems.filter(i => i.section === section)
          if (!items.length) return null
          return (
            <div key={section}>
              <div style={{ padding: '8px 16px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px', marginTop: section === 'Pengaturan' ? '12px' : '0' }}>
                {section}
              </div>
              {items.map(item => (
                <a key={item.id} id={item.id} href={item.href}
                  className={`sidebar-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </div>
          )
        })}
      </nav>

      {/* User Info + Logout */}
      <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#1e3a8a', flexShrink: 0,
          }}>
            {userName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Administrator</div>
          </div>
        </div>
        <button
          id="btn-admin-logout"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', fontSize: '13px', padding: '8px 12px', color: '#dc2626' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Keluar
        </button>
      </div>
    </aside>
  )
}
