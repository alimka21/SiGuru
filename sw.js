
const CACHE_NAME = 'siguru-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
  // Vite generates hashed filenames, so we rely on runtime caching for JS/CSS chunks
];

self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 1. Navigation requests (HTML) -> Network First (for fresh data), fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match(event.request);
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts) -> Cache First, Stale While Revalidate
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
             caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
             });
          }
          return networkResponse;
        });
        
        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. API Requests (Supabase, etc) -> Network Only (Do not cache here to avoid stale data)
  return; 
});
