// BUMP THE VERSION! -> Changed from v11 to v12
const CACHE_NAME = 'vardhan-wears-v12'; 
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
  console.log('Service Worker: Installing v12...'); // Update log to v12
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell v12'); // Update log to v12
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v12...'); // Update log to v12
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // This is crucial: It deletes v11 (and older) caches
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