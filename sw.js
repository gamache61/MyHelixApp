const CACHE_NAME = 'helix-groq-v48.5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate & Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
});

// Fetch Logic
self.addEventListener('fetch', (event) => {
  // If calling Groq API, go straight to network (bypass cache)
  if (event.request.url.includes('groq.com')) {
    event.respondWith(fetch(event.request));
  } else {
    // For the UI, try cache first, then network
    event.respondWith(
      caches.match(event.request).then((res) => res || fetch(event.request))
    );
  }
});