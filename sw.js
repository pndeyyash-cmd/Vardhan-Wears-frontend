// BUMP THE VERSION!
const CACHE_NAME = 'vardhan-wears-v11'; 
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
  '/images/icons/android-chrome-512x512.png',
  // ADD THE NEW APPLE ICON
  '/images/icons/apple-touch-icon.png' 
];

// 1. Install the service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v11...'); // Update log
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell v11'); // Update log
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v11...'); // Update log
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
  if (event.request.method === 'GET' && URLS_TO_CACHE.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        }
      )
    );
  }
});