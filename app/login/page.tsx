'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      })
      if (res?.error) {
        setError('Email atau password salah. Coba lagi.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { label: 'Admin', email: 'admin@globalinsani.sch.id', pass: 'admin123', color: '#1e3a8a' },
    { label: 'Guru', email: 'ustadzah.aisyah@globalinsani.sch.id', pass: 'guru123', color: '#059669' },
    { label: 'Ortu', email: 'ortu.ahmad@globalinsani.sch.id', pass: 'ortu123', color: '#d97706' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 40%, #1d4ed8 70%, #2563eb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '320px', height: '320px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '240px', height: '240px',
        borderRadius: '50%',
        background: 'rgba(180,83,9,0.12)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '5%',
        width: '120px', height: '120px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
        pointerEvents: 'none',
      }} />

      <div className="animate-slideUp" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: '28px',
        padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px', height: '72px',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(30,58,138,0.3)',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M6 8C6 6.9 6.9 6 8 6h20c1.1 0 2 .9 2 2v20c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8z" fill="rgba(255,255,255,0.15)"/>
              <path d="M11 13h14M11 18h10M11 23h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="27" cy="11" r="5" fill="#f59e0b"/>
              <path d="M25 11l1.5 1.5L29 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#1e3a8a',
            margin: '0 0 4px',
            letterSpacing: '-0.5px',
          }}>MUTQIN</h1>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>
            Sistem Administrasi Tahfidz & Tahsin<br />
            <span style={{ color: '#1e3a8a', fontWeight: 600 }}>SMP Global Insani School</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <div className="input-icon-wrap">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="nama@globalinsani.sch.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                }}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: '4px', width: '100%' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                Masuk...
              </span>
            ) : 'Masuk'}
          </button>
        </form>

        {/* Demo Accounts */}
        <div style={{ marginTop: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Demo Akun
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pass) }}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: '12px',
                  border: `1.5px solid ${acc.color}22`,
                  background: `${acc.color}08`,
                  color: acc.color,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.01em',
                }}
                onMouseOver={e => (e.currentTarget.style.background = `${acc.color}18`)}
                onMouseOut={e => (e.currentTarget.style.background = `${acc.color}08`)}
              >
                {acc.label}
              </button>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
            Klik tombol di atas lalu tekan Masuk
          </p>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#cbd5e1',
          marginTop: '28px',
        }}>
          © 2025 SMP Global Insani School · Powered by MUTQIN
        </p>
      </div>
    </div>
  )
}
