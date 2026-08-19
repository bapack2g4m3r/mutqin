export default function MaintenancePage() {
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
        maxWidth: '480px',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: '28px',
        padding: '48px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(20px)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#1e3a8a',
          margin: '0 0 16px',
          letterSpacing: '-0.5px',
        }}>Sedang Dalam Perbaikan</h1>
        
        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, marginBottom: '32px' }}>
          Mohon maaf, layanan MUTQIN saat ini sedang dalam proses pemeliharaan atau pembaruan sistem. Silakan coba kembali beberapa saat lagi.
        </p>

        <a
          href="/login"
          className="btn btn-primary btn-lg"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', textDecoration: 'none' }}
        >
          Kembali ke Halaman Login
        </a>

        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#94a3b8',
          marginTop: '32px',
        }}>
          © 2026 SMP Global Insani School · Powered by MUTQIN
        </p>
      </div>
    </div>
  )
}
