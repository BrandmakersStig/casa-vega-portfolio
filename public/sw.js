// Offline cache for recently viewed photos — "recently viewed images are
// available offline" from the brief. Deliberately narrow in scope: only
// intercepts GET requests for image bytes (local /seed/ derivatives or the
// Supabase Storage bucket), and never touches navigation/HTML/API requests
// — a broken image cache degrades gracefully; a broken page cache doesn't.
const CACHE_NAME = 'portfolio-images-v1'
const IMAGE_PATTERN = /\/seed\/|\/storage\/v1\/object\/public\//

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (!IMAGE_PATTERN.test(request.url)) return

  // Stale-while-revalidate: serve the cached copy instantly if we have one
  // (this is what makes recently-viewed images work offline), but always
  // refresh the cache in the background so it doesn't go stale.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        .catch(() => cached)
      return cached ?? network
    })
  )
})
