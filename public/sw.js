const CACHE_NAME = 'academycraft-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/quests',
  '/shop',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests and Supabase calls
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached version or fetch from network
      const fetched = fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline and we have a cached page, return it
          if (cached) return cached;

          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/dashboard');
          }

          return new Response('Offline', { status: 503 });
        });

      // Return cached version immediately, update in background
      return cached || fetched;
    })
  );
});

// Background sync for pending activities (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-activities') {
    // Sync pending activities when back online
    console.log('Syncing pending activities...');
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/dashboard',
      },
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
