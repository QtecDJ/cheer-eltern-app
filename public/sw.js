// Member App Service Worker v1.2.0
// Entwickelt von ICA-Dev Kai Püttmann

const CACHE_NAME = 'member-app-v1.2.0';
const STATIC_CACHE = 'member-static-v1.2.0';
const DYNAMIC_CACHE = 'member-dynamic-v1.2.0';
const API_CACHE = 'member-api-v1.2.0';

// Statische Assets die beim Install gecached werden
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// API-Routes die gecached werden sollen
const API_ROUTES = [
  '/api/',
];

// Maximale Cache-Größe für dynamische Inhalte
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_API_CACHE_SIZE = 20;

// Cache-Dauer in Sekunden
const CACHE_DURATION = {
  api: 5 * 60, // 5 Minuten für API
  static: 7 * 24 * 60 * 60, // 7 Tage für statische Assets
  dynamic: 24 * 60 * 60, // 1 Tag für dynamische Inhalte
};

// Installation - Statische Assets cachen
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.log('[SW] Cache error:', err))
  );
});

// Aktivierung - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('member-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE &&
                     name !== API_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Cache-Größe begrenzen
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxSize) {
    await cache.delete(keys[0]);
    return limitCacheSize(cacheName, maxSize);
  }
}

// Network-First Strategie für API-Calls
async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone und cache die Response
      cache.put(request, response.clone());
      await limitCacheSize(API_CACHE, MAX_API_CACHE_SIZE);
    }
    return response;
  } catch (error) {
    // Bei Netzwerkfehler aus Cache holen
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache-First Strategie für statische Assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      await limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }
    return response;
  } catch (error) {
    // Offline-Fallback für Navigation
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    throw error;
  }
}

// Stale-While-Revalidate für HTML-Seiten
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
      }
      return response;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Fetch-Handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Nur gleiche Origin behandeln
  if (url.origin !== location.origin) {
    return;
  }
  
  // Chrome Extensions ignorieren
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API-Calls: Network-First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Statische Assets: Cache-First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|ico)$/) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // HTML/Navigation: Stale-While-Revalidate
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // Alles andere: Cache-First
  event.respondWith(cacheFirst(request));
});

// Background Sync für Offline-Actions (Future Feature)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
});

// Push Notifications (Future Feature)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Member App';
  const options = {
    body: data.body || 'Neue Benachrichtigung',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
