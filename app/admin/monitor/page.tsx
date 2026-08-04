'use client'
import { useState, useEffect } from 'react'

interface ActiveUser {
  id: string
  name: string
  role: string
  lastActiveAt: string
}

interface ActivityLog {
  id: string
  action: string
  description: string
  createdAt: string
  user: {
    name: string
    role: string
  }
}

interface MonitorData {
  activeUsers: ActiveUser[]
  activityLogs: ActivityLog[]
  allUsers: ActiveUser[]
}

export default function MonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/monitor')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Refresh otomatis setiap 30 detik
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="skeleton" style={{ height: '40px', width: '250px', borderRadius: '8px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '20px', width: '350px', borderRadius: '6px', marginBottom: '32px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        <div className="skeleton" style={{ height: '400px', borderRadius: '24px' }} />
        <div className="skeleton" style={{ height: '400px', borderRadius: '24px', gridColumn: 'span 2' }} />
      </div>
      <div className="skeleton" style={{ height: '400px', borderRadius: '24px', marginTop: '2rem' }} />
    </div>
  )

  return (
    <div className="container" style={{ padding: '2rem', paddingBottom: '8rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem' }}>Monitoring Sistem</h1>
        <p className="text-muted">Pantau pengguna yang sedang aktif dan riwayat aktivitas mereka.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* PANEL USER AKTIF */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px' }}>
          <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)', borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
            <h2 className="font-semibold flex items-center gap-2">
              <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }}></div>
              User Aktif Sekarang
            </h2>
            <span className="badge badge-mumtaz">
              {data?.activeUsers.length || 0} Online
            </span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {data?.activeUsers.length === 0 ? (
              <div className="text-muted text-sm text-center" style={{ padding: '2rem' }}>Tidak ada user yang aktif saat ini.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data?.activeUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-4" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-gray-50)' }}>
                    <div className="avatar-placeholder avatar-md" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}>
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div className="font-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                      <div className="text-xs" style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                        <span className="font-medium" style={{ color: u.role === 'ADMIN' ? 'var(--color-error)' : u.role === 'GURU' ? 'var(--color-primary-600)' : 'var(--color-warning)' }}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(u.lastActiveAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL ACTIVITY LOG */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px', gridColumn: 'span 2' }}>
          <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)', borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
            <h2 className="font-semibold">Riwayat Aktivitas (Log)</h2>
            <button onClick={fetchData} className="btn btn-ghost btn-sm flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              Refresh
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {data?.activityLogs.length === 0 ? (
              <div className="text-muted text-sm text-center" style={{ padding: '2rem' }}>Belum ada riwayat aktivitas.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th>Waktu</th>
                    <th>Pengguna</th>
                    <th>Aktivitas</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.activityLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div className="font-medium">{log.user.name}</div>
                        <div className="text-xs text-muted">{log.user.role}</div>
                      </td>
                      <td>
                        <div className="font-medium">{log.description}</div>
                        <div className="text-xs text-muted" style={{ marginTop: '2px' }}>{log.action}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* PANEL REPORT LAST LOGIN */}
      <div className="card mt-8" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
        <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)', borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
          <h2 className="font-semibold">Laporan Last Login (Terakhir Aktif)</h2>
          <span className="badge badge-jayyid">
            Total {data?.allUsers.length || 0} Pengguna
          </span>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: '-1rem', zIndex: 10, background: 'white' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--color-gray-100)' }}>Nama Pengguna</th>
                <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--color-gray-100)' }}>Peran (Role)</th>
                <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--color-gray-100)' }}>Terakhir Login / Aktif</th>
                <th style={{ textAlign: 'center', padding: '1rem', borderBottom: '2px solid var(--color-gray-100)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.allUsers.map(u => {
                const isOnline = u.lastActiveAt && (Date.now() - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000)
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-gray-50)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div className="font-medium">{u.name}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="text-xs font-medium" style={{ color: u.role === 'ADMIN' ? 'var(--color-error)' : u.role === 'GURU' ? 'var(--color-primary-600)' : 'var(--color-warning)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      {u.lastActiveAt ? (
                        <div className="flex flex-col">
                          <span>{new Date(u.lastActiveAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <span className="text-xs text-muted">{new Date(u.lastActiveAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span className="text-muted italic">Belum pernah login</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {isOnline ? (
                        <span className="badge badge-mumtaz text-xs">Online</span>
                      ) : (
                        <span className="badge badge-ghair text-xs">Offline</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
