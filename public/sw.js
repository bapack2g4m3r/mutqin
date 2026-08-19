const CACHE_NAME = 'mutqin-v13'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/guru/dashboard',
  '/guru/siswa',
  '/guru/siswa/detail',
  '/guru/siswa/setoran',
  '/guru/riwayat',
  '/guru/profil',
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
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          fetch(url, { credentials: 'omit' }).then(res => {
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

// Helper: check if request is a Next.js RSC (React Server Component) payload
function isRSCRequest(request) {
  return (
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') !== null ||
    new URL(request.url).searchParams.has('_rsc')
  )
}

// Fetch — Network First for pages & data, Cache First for static immutable assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Jangan tangani POST/PUT/DELETE
  if (event.request.method !== 'GET') {
    return
  }
  if (url.pathname.startsWith('/api/auth/') && url.pathname !== '/api/auth/session') {
    return
  }

  // 0. RSC Payload Requests (Next.js internal data fetches for client navigation)
  //    Jika offline: kembalikan empty RSC response agar Next.js tidak crash
  //    Ini HARUS dicek SEBELUM handler navigate
  if (isRSCRequest(event.request)) {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          const response = await fetch(event.request, { signal: controller.signal })
          clearTimeout(timeoutId)
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
          }
          return response
        } catch {
          // Offline: coba cache dulu
          const cached = await caches.match(event.request)
          if (cached) return cached
          // Return empty RSC payload — Next.js akan tetap render dari HTML shell
          return new Response('', {
            status: 200,
            headers: {
              'Content-Type': 'text/x-component',
              'X-Offline': '1',
            }
          })
        }
      })()
    )
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
      (async () => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          
          const response = await fetch(event.request, { signal: controller.signal })
          clearTimeout(timeoutId)
          
          if (response.ok) {
            const clone = response.clone()
            const cache = await caches.open(CACHE_NAME)
            // Cache dengan URL tanpa query params agar bisa di-match saat offline
            const cleanUrl = new URL(event.request.url)
            cleanUrl.search = ''
            await cache.put(cleanUrl.toString(), response.clone())
            await cache.put(event.request, clone)
          }
          return response
        } catch (error) {
          try {
            // Coba match dengan URL bersih (tanpa query params) terlebih dahulu
            const urlObj = new URL(event.request.url)
            urlObj.search = ''
            
            let cached = await caches.match(urlObj.toString())
            if (!cached) {
              cached = await caches.match(event.request, { ignoreSearch: true })
            }
            if (cached) return cached

            const dashboardCached = await caches.match('/guru/dashboard', { ignoreSearch: true })
            if (dashboardCached) return dashboardCached
            
            const loginCached = await caches.match('/login', { ignoreSearch: true })
            if (loginCached) return loginCached
          } catch (matchError) {
            console.error('Cache match error', matchError)
          }
          return new Response(
            '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - MUTQIN</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0f4f8;color:#333;text-align:center;padding:1rem;}h1{color:#1e3a8a;margin-bottom:0.5rem;}p{margin-bottom:2rem;}a{display:inline-block;padding:10px 20px;background:#1e3a8a;color:white;text-decoration:none;border-radius:8px;font-weight:bold;}</style></head><body><h1>Tidak Ada Koneksi</h1><p>Anda sedang offline dan halaman ini belum tersimpan.</p><a href="/">Kembali ke Beranda</a></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html' } }
          )
        }
      })()
    )
    return
  }

  // 3. API Read Calls (/api/...) -> Network First with dynamic cache for offline read
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          
          const response = await fetch(event.request, { signal: controller.signal })
          clearTimeout(timeoutId)
          
          if (response.ok) {
            const clone = response.clone()
            const cache = await caches.open(CACHE_NAME)
            await cache.put(event.request, clone)
          }
          return response
        } catch (error) {
          const cached = await caches.match(event.request)
          if (cached) return cached
          return new Response(JSON.stringify({ error: 'offline', offline: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      })()
    )
    return
  }

  // Default Network First
  event.respondWith(
    (async () => {
      try {
        const isRSC = event.request.headers.has('RSC') || event.request.headers.get('Accept')?.includes('text/x-component')
        const controller = new AbortController()
        const timeoutMs = isRSC ? 3000 : 15000
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        
        const response = await fetch(event.request, { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (response.ok) {
          if (!isRSC && event.request.method === 'GET') {
            const clone = response.clone()
            const cache = await caches.open(CACHE_NAME)
            await cache.put(event.request, clone)
          }
        }
        return response
      } catch (error) {
        const cached = await caches.match(event.request)
        if (cached) return cached
        
        if (event.request.headers.get('Accept')?.includes('text/html')) {
          return new Response(
            '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - MUTQIN</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0f4f8;color:#333;text-align:center;padding:1rem;}h1{color:#1e3a8a;margin-bottom:0.5rem;}p{margin-bottom:2rem;}a{display:inline-block;padding:10px 20px;background:#1e3a8a;color:white;text-decoration:none;border-radius:8px;font-weight:bold;}</style></head><body><h1>Tidak Ada Koneksi</h1><p>Anda sedang offline dan halaman ini belum tersimpan.</p><a href="/">Kembali ke Beranda</a></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html' } }
          )
        }
        
        // Return a generic error response if not cached
        return new Response(JSON.stringify({ error: 'offline', offline: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    })()
  )
})
