const CACHE_NAME = 'sp-com-amor-v10';
const ASSETS = [
  './index.html',
  './manifest.json',
  './assets/vue.global.prod.js',
  './assets/leaflet.js',
  './assets/leaflet.css',
  './assets/tailwind.js',
  './assets/icon.svg',
  './assets/marker-icon.png',
  './assets/marker-icon-2x.png',
  './assets/marker-shadow.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  // Network-first para o HTML (garante atualizações)
  const isHTML = req.mode === 'navigate'
    || req.destination === 'document'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('index.html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first para o resto
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

