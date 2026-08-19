'use client'

import { useEffect, useState, useCallback } from 'react'

const OFFLINE_QUEUE_KEY = 'mutqin_offline_queue'
const CACHE_META_KEY = 'mutqin_cache_meta'

interface CacheMeta {
  lastDownload: string | null
  siswaCount: number
  setoranCount: number
  dashboardCached: boolean
}

interface QueueItem {
  id: number
  body: any
  savedAt: string
}

function getQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function getCacheMeta(): CacheMeta {
  try {
    const raw = localStorage.getItem(CACHE_META_KEY)
    return raw ? JSON.parse(raw) : { lastDownload: null, siswaCount: 0, setoranCount: 0, dashboardCached: false }
  } catch { return { lastDownload: null, siswaCount: 0, setoranCount: 0, dashboardCached: false } }
}

function saveCacheMeta(meta: CacheMeta) {
  try { localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta)) } catch {}
}

function formatRelativeTime(isoStr: string | null) {
  if (!isoStr) return null
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  return new Date(isoStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function OfflineReadyManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [meta, setMeta] = useState<CacheMeta>({ lastDownload: null, siswaCount: 0, setoranCount: 0, dashboardCached: false })
  const [queueCount, setQueueCount] = useState(0)
  const [downloadResult, setDownloadResult] = useState<'success' | 'error' | null>(null)
  const [syncResult, setSyncResult] = useState(0)
  const [showPanel, setShowPanel] = useState(false)

  const refresh = useCallback(() => {
    setMeta(getCacheMeta())
    setQueueCount(getQueue().length)
  }, [])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    refresh()

    const onOnline = () => { setIsOnline(true); refresh() }
    const onOffline = () => { setIsOnline(false); refresh() }
    const onStorage = () => refresh()

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('storage', onStorage)
    }
  }, [refresh])

  async function handleDownload() {
    if (!isOnline || downloading) return
    setDownloading(true)
    setDownloadResult(null)

    try {
      // Fetch and cache dashboard data, students, and HTML shells for dynamic routes
      const [dashRes, siswaRes, setoranRes] = await Promise.all([
        fetch('/api/guru/dashboard'),
        fetch('/api/siswa?limit=2000'),
        fetch('/api/setoran?limit=99999'),
        fetch('/guru/dashboard'),
        fetch('/guru/siswa'),
        fetch('/guru/siswa/detail'),
        fetch('/guru/siswa/setoran'),
        fetch('/guru/riwayat'),
        fetch('/guru/profil'),
        fetch('/api/auth/session')
      ])

      let siswaCount = 0
      let setoranCount = 0
      let dashboardCached = false

      if (dashRes.ok) {
        const dashData = await dashRes.json()
        if (dashData && !dashData.error) {
          localStorage.setItem('mutqin_cached_guru_dashboard', JSON.stringify(dashData))
          dashboardCached = true
        }
      }

      if (siswaRes.ok) {
        const siswaData = await siswaRes.json()
        if (siswaData && !siswaData.error && !siswaData.offline) {
          const list = siswaData.siswa || []
          localStorage.setItem('mutqin_cached_siswa_list', JSON.stringify(list))
          siswaCount = list.length
        }
      }

      if (setoranRes.ok) {
        const setoranData = await setoranRes.json()
        if (setoranData && !setoranData.error) {
          const { set } = await import('idb-keyval')
          const setorans = setoranData.setorans || []
          await set('mutqin_cached_setoran_list', setorans)
          setoranCount = setorans.length
        }
      }

      const newMeta: CacheMeta = {
        lastDownload: new Date().toISOString(),
        siswaCount,
        setoranCount,
        dashboardCached,
      }
      saveCacheMeta(newMeta)
      setMeta(newMeta)
      setDownloadResult('success')
    } catch {
      setDownloadResult('error')
    } finally {
      setDownloading(false)
      setTimeout(() => setDownloadResult(null), 4000)
    }
  }

  async function handleSyncNow() {
    const queue = getQueue()
    if (queue.length === 0 || !isOnline || syncing) return
    setSyncing(true)

    try {
      const results = await Promise.allSettled(
        queue.map(item =>
          fetch('/api/setoran', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.body),
          })
        )
      )

      const failed = queue.filter((_, i) => {
        const r = results[i]
        return r.status === 'rejected' || (r as PromiseFulfilledResult<Response>).value?.ok === false
      })

      if (failed.length > 0) {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed))
      } else {
        localStorage.removeItem(OFFLINE_QUEUE_KEY)
      }

      const sent = queue.length - failed.length
      setSyncResult(sent)
      refresh()
      setTimeout(() => setSyncResult(0), 4000)
    } catch {
      // silent
    } finally {
      setSyncing(false)
    }
  }

  const hasCachedData = meta.siswaCount > 0 || meta.dashboardCached
  const isReady = hasCachedData

  return (
    <>
      {/* Floating Trigger Button */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '16px',
          border: `1.5px solid ${isReady ? '#d1fae5' : '#fef3c7'}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={() => setShowPanel(!showPanel)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: isReady ? '#d1fae5' : '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0,
            }}>
              {isReady ? '✅' : '⚠️'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                {isReady ? 'Data Tersinkronisasi' : 'Belum Tersinkronisasi'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                {isReady
                  ? `${meta.siswaCount} siswa tersimpan · ${meta.lastDownload ? formatRelativeTime(meta.lastDownload) : ''}`
                  : 'Unduh data untuk bisa digunakan offline'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {queueCount > 0 && (
              <span style={{
                background: '#fee2e2', color: '#dc2626',
                borderRadius: '20px', padding: '2px 8px',
                fontSize: '11px', fontWeight: 700,
              }}>
                {queueCount} antrian
              </span>
            )}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
              style={{ transform: showPanel ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Panel */}
      {showPanel && (
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '16px', marginBottom: '16px', marginTop: '-8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          animation: 'fadeIn 0.2s ease',
        }}>
          
          {/* Status Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <StatusRow
              icon="📱"
              label="Koneksi"
              value={isOnline ? 'Online' : 'Offline'}
              valueColor={isOnline ? '#059669' : '#dc2626'}
            />
            <StatusRow
              icon="👥"
              label="Data Siswa"
              value={meta.siswaCount > 0 ? `${meta.siswaCount} siswa tersimpan` : 'Belum diunduh'}
              valueColor={meta.siswaCount > 0 ? '#059669' : '#94a3b8'}
            />
            <StatusRow
              icon="📜"
              label="Riwayat Setoran"
              value={meta.setoranCount > 0 ? `${meta.setoranCount} setoran tersimpan` : 'Belum diunduh'}
              valueColor={meta.setoranCount > 0 ? '#059669' : '#94a3b8'}
            />
            <StatusRow
              icon="📊"
              label="Dashboard"
              value={meta.dashboardCached ? 'Tersimpan' : 'Belum diunduh'}
              valueColor={meta.dashboardCached ? '#059669' : '#94a3b8'}
            />
            <StatusRow
              icon="⏳"
              label="Antrian Setoran"
              value={queueCount > 0 ? `${queueCount} setoran menunggu` : 'Tidak ada antrian'}
              valueColor={queueCount > 0 ? '#d97706' : '#059669'}
            />
            {meta.lastDownload && (
              <StatusRow
                icon="🕐"
                label="Terakhir Diunduh"
                value={formatRelativeTime(meta.lastDownload) || '-'}
                valueColor="#64748b"
              />
            )}
          </div>

          {/* Result Feedback */}
          {downloadResult === 'success' && (
            <div style={{
              background: '#d1fae5', color: '#065f46', borderRadius: '10px',
              padding: '10px 14px', fontSize: '13px', fontWeight: 600,
              marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              ✅ Data berhasil diunduh! Aplikasi siap digunakan offline.
            </div>
          )}
          {downloadResult === 'error' && (
            <div style={{
              background: '#fee2e2', color: '#991b1b', borderRadius: '10px',
              padding: '10px 14px', fontSize: '13px', fontWeight: 600,
              marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              ❌ Gagal mengunduh. Periksa koneksi internet.
            </div>
          )}
          {syncResult > 0 && (
            <div style={{
              background: '#d1fae5', color: '#065f46', borderRadius: '10px',
              padding: '10px 14px', fontSize: '13px', fontWeight: 600,
              marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              ✅ {syncResult} setoran offline berhasil dikirim!
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              id="btn-unduh-data-offline"
              onClick={handleDownload}
              disabled={!isOnline || downloading}
              style={{
                flex: 1, padding: '11px 16px',
                borderRadius: '12px', border: 'none', cursor: isOnline && !downloading ? 'pointer' : 'not-allowed',
                background: isOnline && !downloading ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#e2e8f0',
                color: isOnline && !downloading ? 'white' : '#94a3b8',
                fontSize: '13px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              {downloading ? (
                <>
                  <span style={{
                    width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block',
                  }} />
                  Mengunduh...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {isReady ? 'Perbarui Data' : 'Unduh Data'}
                </>
              )}
            </button>

            {queueCount > 0 && (
              <button
                id="btn-sync-sekarang"
                onClick={handleSyncNow}
                disabled={!isOnline || syncing}
                style={{
                  flex: 1, padding: '11px 16px',
                  borderRadius: '12px', border: '2px solid #059669', cursor: isOnline && !syncing ? 'pointer' : 'not-allowed',
                  background: 'white', color: '#059669',
                  fontSize: '13px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                {syncing ? (
                  <>
                    <span style={{
                      width: '14px', height: '14px', border: '2px solid #d1fae5',
                      borderTopColor: '#059669', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite', display: 'inline-block',
                    }} />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="23 4 23 10 17 10"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Kirim ({queueCount})
                  </>
                )}
              </button>
            )}
          </div>

          {!isOnline && (
            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '10px', marginBottom: 0 }}>
              📵 Tidak ada internet · Setoran tetap bisa diinput dan akan terkirim otomatis
            </p>
          )}
        </div>
      )}
    </>
  )
}

function StatusRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: valueColor }}>{value}</span>
    </div>
  )
}
