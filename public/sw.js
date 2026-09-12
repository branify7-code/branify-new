// =========================================================
// BRANIFY service worker — v1 (conservative, honest PWA)
// -------------------------------------------------------
// Strategies:
//   • Navigations (HTML): network-first, cache fallback to the app shell
//     so returning visitors NEVER see stale content unless truly offline.
//   • Same-origin static assets: stale-while-revalidate (instant repeat loads).
//   • Never intercepted: non-GET, cross-origin (fonts/CDN), /api/*,
//     Supabase endpoints, and anything with a query string that looks dynamic.
// Caches are versioned; activate removes every previous branify-* cache.
// =========================================================

const VERSION = 'v1';
const SHELL_CACHE = `branify-shell-${VERSION}`;
const ASSET_CACHE = `branify-assets-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/manifest.json',
  '/branify-icon.png',
  '/brand/branify-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {/* shell precache is best-effort; install must not fail */})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('branify-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

const ASSET_EXTENSIONS = /\.(?:js|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|json|txt|xml|webmanifest)$/i;
const BYPASS_PREFIXES = ['/api/', '/functions/', '/__'];

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Cross-origin (Google Fonts, CDNs): always straight to network
  if (url.origin !== self.location.origin) return;
  // Serverless APIs and internal endpoints: never cached
  if (BYPASS_PREFIXES.some((p) => url.pathname.startsWith(p))) return;
  if (/supabase\.(co|in|net)$/i.test(url.hostname)) return;

  // 1) Navigations — network-first, offline fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Keep a fresh copy of the entry document for offline use
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match('/'))
        )
    );
    return;
  }

  // 2) Same-origin static assets — stale-while-revalidate
  if (url.pathname.startsWith('/assets/') || ASSET_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.status === 200 && response.type === 'basic') {
                cache.put(request, response.clone()).catch(() => {});
              }
              return response;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
  }
  // 3) Everything else (same-origin dynamic): direct to network
});
