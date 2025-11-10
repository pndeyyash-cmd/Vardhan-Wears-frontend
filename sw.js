const CACHE_NAME = 'vardhan-wears-v1';
// This is the list of files to cache.
// We are caching the core pages, not every single product or order.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/cart.html',
  '/profile.html',
  '/login.html',
  '/register.html',
  '/forgot-password.html',
  '/reset-password.html',
  '/manifest.json',
  '/images/icons/android-chrome-192x192.png',
  '/images/icons/android-chrome-512x512.png'
];

// 1. Install the service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// 3. Fetch event (serve from cache first, then network)
self.addEventListener('fetch', (event) => {
  // We only cache GET requests for our app pages.
  // We DO NOT cache API requests (like /api/cart) because we always want live data.
  if (event.request.method === 'GET' && URLS_TO_CACHE.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // If we have it in cache, serve it.
          if (response) {
            return response;
          }
          // Otherwise, fetch it from the network.
          return fetch(event.request);
        }
      )
    );
  }
});