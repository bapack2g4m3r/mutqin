'use client'
import { useSession, signOut } from 'next-auth/react'
import MobileNav from '@/components/layout/MobileNav'

export default function OrtuProfilPage() {
  const { data: session } = useSession()
  const name = session?.user?.name || 'Orang Tua'
  const email = session?.user?.email || ''
  const initials = name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }}>
      <header className="mobile-header">
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>Profil</h1>
      </header>

      <div className="page-mobile">
        <div className="animate-fadeIn" style={{
          background: 'linear-gradient(135deg, #b45309, #d97706)',
          borderRadius: '24px', padding: '28px',
          textAlign: 'center', marginTop: '12px', marginBottom: '20px',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '24px', fontWeight: 700, color: 'white',
            border: '3px solid rgba(255,255,255,0.3)',
          }}>
            {initials}
          </div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>{name}</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '4px' }}>{email}</div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)', color: 'white',
            borderRadius: '20px', padding: '4px 16px',
            fontSize: '12px', fontWeight: 600, marginTop: '10px',
          }}>
            Orang Tua / Wali Siswa
          </div>
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Informasi
          </div>
          {[
            { label: 'Sekolah', value: 'SMP Global Insani School' },
            { label: 'Portal', value: 'Orang Tua / Wali Siswa' },
            { label: 'Update', value: 'Real-time (30 detik)' },
            { label: 'Sistem', value: 'MUTQIN v1.0' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px',
            }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{item.value}</span>
            </div>
          ))}
        </div>

        <button
          id="btn-ortu-logout"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn"
          style={{ width: '100%', background: '#fee2e2', color: '#dc2626', borderRadius: '16px', padding: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '15px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Keluar dari Aplikasi
        </button>
      </div>

      <MobileNav role="ortu" />
    </div>
  )
}
