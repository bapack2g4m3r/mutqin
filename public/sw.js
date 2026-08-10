const CACHE_NAME = 'mutqin-v4'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/guru/dashboard',
  '/guru/siswa',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
]

// Install — cache core static assets
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Add each asset individually so one failure doesn't fail the whole array
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          fetch(url).then(res => {
            if (res.ok) {
              return cache.put(url, res.clone());
            }
          }).catch(err => console.error('Failed to cache', url, err))
        )
      )
    })
  )
})

// Activate — remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch — Network First for pages & data, Cache First for static immutable assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Jangan tangani POST/PUT/DELETE atau Auth API
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/auth/')) {
    return
  }

  // 1. Next.js Static Assets (_next/static) & Images -> Cache First with Network Fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
          }
          return res
        }).catch(() => new Response('', { status: 408 }))
      })
    )
    return
  }

  // 2. Dynamic Pages (HTML Navigation) -> Network First dengan Timeout & Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached
          
          // Match student detail page: /guru/siswa/xxxx
          if (url.pathname.match(/^\/guru\/siswa\/[^\/]+$/)) {
            const shell = await caches.match('/guru/siswa/offline-shell')
            if (shell) return shell
          }
          
          // Match student setoran page: /guru/siswa/xxxx/setoran
          if (url.pathname.match(/^\/guru\/siswa\/[^\/]+\/setoran$/)) {
            const shell = await caches.match('/guru/siswa/offline-shell/setoran')
            if (shell) return shell
          }
          // Fallback to guru dashboard or login if specific page not cached
          const dashboardCached = await caches.match('/guru/dashboard')
          if (dashboardCached) return dashboardCached
          const loginCached = await caches.match('/login')
          if (loginCached) return loginCached
          
          return new Response(
            '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - MUTQIN</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0f4f8;color:#333;text-align:center;padding:1rem;}h1{color:#1e3a8a;margin-bottom:0.5rem;}p{margin-bottom:2rem;}a{display:inline-block;padding:10px 20px;background:#1e3a8a;color:white;text-decoration:none;border-radius:8px;font-weight:bold;}</style></head><body><h1>Tidak Ada Koneksi</h1><p>Anda sedang offline dan halaman ini belum tersimpan.</p><a href="/">Kembali ke Beranda</a></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html' } }
          )
        })
    )
    return
  }

  // 3. API Read Calls (/api/...) -> Network First with dynamic cache for offline read
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached
          return new Response(JSON.stringify({ error: 'offline', offline: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        })
    )
    return
  }

  // Default Network First
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(event.request)
        if (cached) return cached
        
        // Return a generic error response if not in cache to avoid TypeError
        return new Response(JSON.stringify({ error: 'offline', offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      })
  )
})
