const CACHE_NAME = 'helix-v48.7';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Always go to network for AI APIs to prevent identity caching errors
  if (e.request.url.includes('groq.com') || e.request.url.includes('googleapis.com')) {
    e.respondWith(fetch(e.request));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});