// Adventure Planner service worker: makes the app installable and lets it open without a connection.
// - The page: network first (it carries the server's settings), the last copy when offline.
// - Built files (/assets/*, hashed names): cache first, they never change.
// - Icons and the manifest: cache, refreshed in the background.
// - API calls, maps, tiles and other sites: never cached here (always live).
const VERSION = 'v1';
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(PAGES).then(c => c.addAll(['/', '/manifest.webmanifest', '/icon-192.png'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== PAGES && k !== ASSETS).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(PAGES).then(c => c.put('/', copy)); }
          return res;
        })
        .catch(() => caches.match('/').then(r => r || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(ASSETS).then(c => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  if (/\.(png|webmanifest|svg|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(hit => {
        const live = fetch(req).then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(PAGES).then(c => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || live;
      }),
    );
  }
});
