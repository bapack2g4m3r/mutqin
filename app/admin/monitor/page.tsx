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

  if (loading) return <div className="p-8">Memuat data monitoring...</div>

  return (
    <div className="p-8 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Monitoring Sistem</h1>
        <p className="text-slate-500">Pantau pengguna yang sedang aktif dan riwayat aktivitas mereka.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PANEL USER AKTIF */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                User Aktif Sekarang
              </h2>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {data?.activeUsers.length || 0} Online
              </span>
            </div>
            <div className="p-0 flex-1 overflow-y-auto" style={{ maxHeight: '600px' }}>
              {data?.activeUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Tidak ada user yang aktif saat ini.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data?.activeUsers.map(u => (
                    <li key={u.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">{u.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <span className={`font-medium ${u.role === 'ADMIN' ? 'text-rose-500' : u.role === 'GURU' ? 'text-blue-500' : 'text-amber-500'}`}>
                            {u.role}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(u.lastActiveAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* PANEL ACTIVITY LOG */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Riwayat Aktivitas (Log)</h2>
              <button onClick={fetchData} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                Refresh
              </button>
            </div>
            <div className="p-0 flex-1 overflow-y-auto" style={{ maxHeight: '600px' }}>
              {data?.activityLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Belum ada riwayat aktivitas.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Waktu</th>
                      <th className="px-6 py-4 font-medium">Pengguna</th>
                      <th className="px-6 py-4 font-medium">Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.activityLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{log.user.name}</div>
                          <div className="text-xs text-slate-500">{log.user.role}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-800">{log.description}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{log.action}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
