/* Qiymat — Service Worker
 * Offline-first PWA with smart caching.
 */
const VERSION = 'qiymat-v1.0.0';
const CORE_CACHE = `core-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './confetti.js',
  './manifest.json',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => {
      return Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url).catch(() => null)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => ![CORE_CACHE, RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation: network-first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200 && (url.protocol === 'https:' || url.protocol === 'http:')) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
