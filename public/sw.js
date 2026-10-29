/* nook service worker
 *
 * - precaches the app shell (index.html, offline page, icons) and the hashed
 *   JS/CSS the shell points at, so the app opens with no connection
 * - navigations: network first (3 s), then the cached shell, then offline.html
 * - /assets/* (hashed, immutable): cache first
 * - other same-origin files: stale-while-revalidate
 * - cross-origin images and fonts (café photos, Google Fonts): stale-while-revalidate
 * - API calls to other origins are never touched; the app keeps its own
 *   offline copy of the data it needs (see src/lib/offline.js)
 */
const VERSION = 'nook-v3';
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const IMG_CACHE = `${VERSION}-img`; // no-cors (plain <img>) responses
const IMG_CORS_CACHE = `${VERSION}-img-cors`; // cors responses (used for the desk cut-outs)
const MAX_IMAGES = 160;

const OFFLINE_URL = '/offline.html';
const SHELL_URL = '/index.html';

// must exist or install fails (the app cannot open offline without them)
const REQUIRED = [SHELL_URL, OFFLINE_URL];
// nice to have; a missing file never blocks install
const OPTIONAL = [
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32.png',
  '/apple-touch-icon-180.png',
  '/icons/android/launchericon-192x192.png',
  '/icons/android/launchericon-512x512.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);

      // the shell: fetched fresh, stored under both / and /index.html
      const shell = await fetch(new Request(SHELL_URL, { cache: 'reload' }));
      if (!shell.ok) throw new Error('shell unavailable');
      const html = await shell.clone().text();
      await cache.put(SHELL_URL, shell.clone());
      await cache.put('/', shell);

      const offline = await fetch(new Request(OFFLINE_URL, { cache: 'reload' }));
      if (!offline.ok) throw new Error('offline page unavailable');
      await cache.put(OFFLINE_URL, offline);

      // the hashed bundle files the shell loads
      const assets = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)).map((m) => m[1]);
      await Promise.all(
        [...new Set(assets), ...OPTIONAL].map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
        )
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, STATIC_CACHE, IMG_CACHE, IMG_CORS_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('nook-') && !keep.has(n)).map((n) => caches.delete(n)));
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.disable().catch(() => {});
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

async function navigate(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await Promise.race([fetch(request), timeout(3000)]);
    const type = response.headers.get('content-type') || '';
    if (response.ok && type.includes('text/html')) {
      // a fresh shell for the next offline visit (the SPA shell is the same for every route)
      cache.put(SHELL_URL, response.clone()).catch(() => {});
      cache.put('/', response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    return (await cache.match(SHELL_URL)) || (await cache.match('/')) || (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
  return response;
}

async function staleWhileRevalidate(request, cacheName, { max } = {}) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone()).then(() => (max ? trim(cacheName, max) : null)).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  if (hit) return hit;
  const fresh = await refresh;
  return fresh || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname === '/sw.js') return;
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(cacheFirst(request, STATIC_CACHE).catch(() => caches.match(request)));
      return;
    }
    event.respondWith(
      staleWhileRevalidate(request, STATIC_CACHE).then((r) => r || caches.match(request))
    );
    return;
  }

  // cross-origin: only pictures and fonts are kept; everything else (the API) goes straight to the network
  const isImage = request.destination === 'image';
  const isFont =
    request.destination === 'font' ||
    request.destination === 'style' && url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
  if (isImage || isFont) {
    const cacheName = request.mode === 'cors' ? IMG_CORS_CACHE : IMG_CACHE;
    event.respondWith(staleWhileRevalidate(request, cacheName, { max: MAX_IMAGES }));
  }
});
