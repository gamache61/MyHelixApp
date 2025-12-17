const CACHE_NAME = 'helix-v50-stable';
const urlsToCache = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); caches.keys().then(k => Promise.all(k.map(n => n !== CACHE_NAME && caches.delete(n)))); });
self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
