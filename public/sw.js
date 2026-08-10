const CACHE_NAME = 'mutqin-v1'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/guru/dashboard',
  '/guru/siswa',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Install — cache static assets
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

// Fetch — Network First for API, Cache First for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Jangan cache API calls, Next.js internals, atau auth calls
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/auth/') ||
    event.request.method !== 'GET'
  ) {
    return // Biarkan browser handle langsung
  }

  // Network First dengan fallback ke cache untuk halaman
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Simpan respons segar ke cache
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        // Fallback ke cache saat offline
        caches.match(event.request).then(cached => {
          if (cached) return cached
          // Untuk navigasi, kembalikan halaman login sebagai fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/login')
          }
          return new Response('Offline', { status: 503 })
        })
      )
  )
})
