const CACHE_NAME = 'mutqin-v2'
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
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
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
          // Fallback to guru dashboard or login if specific page not cached
          const dashboardCached = await caches.match('/guru/dashboard')
          if (dashboardCached) return dashboardCached
          const loginCached = await caches.match('/login')
          if (loginCached) return loginCached
          return new Response('Offline', { status: 503 })
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
      .catch(() => caches.match(event.request))
  )
})
