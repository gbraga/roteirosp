const CACHE_NAME = 'sp-com-amor-v1';
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
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
