// Member App Service Worker v1.3.0
// Entwickelt von ICA-Dev Kai Püttmann
// Moderne PWA mit verbessertem Caching

const SW_VERSION = '1.3.0';
const CACHE_NAME = `member-app-v${SW_VERSION}`;
const STATIC_CACHE = `member-static-v${SW_VERSION}`;
const DYNAMIC_CACHE = `member-dynamic-v${SW_VERSION}`;
const API_CACHE = `member-api-v${SW_VERSION}`;
const IMAGE_CACHE = `member-images-v${SW_VERSION}`;

// Statische Assets die beim Install gecached werden
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
];

// Cache-Konfiguration
const CACHE_CONFIG = {
  maxDynamicSize: 50,
  maxApiSize: 30,
  maxImageSize: 100,
  apiCacheDuration: 5 * 60 * 1000, // 5 Minuten
  staticCacheDuration: 7 * 24 * 60 * 60 * 1000, // 7 Tage
  imageCacheDuration: 30 * 24 * 60 * 60 * 1000, // 30 Tage
};

// ============================================
// INSTALLATION
// ============================================
self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  
  event.waitUntil(
    Promise.all([
      // Statische Assets cachen
      caches.open(STATIC_CACHE).then((cache) => {
        console.log(`[SW ${SW_VERSION}] Caching static assets`);
        return cache.addAll(STATIC_ASSETS);
      }),
      // Sofort aktivieren ohne auf andere Tabs zu warten
      self.skipWaiting(),
    ])
  );
});

// ============================================
// AKTIVIERUNG
// ============================================
self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`);
  
  event.waitUntil(
    Promise.all([
      // Alte Caches löschen
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('member-') && 
                     !name.includes(SW_VERSION);
            })
            .map((name) => {
              console.log(`[SW ${SW_VERSION}] Deleting old cache:`, name);
              return caches.delete(name);
            })
        );
      }),
      // Sofort Kontrolle übernehmen
      self.clients.claim(),
    ])
  );
});

// ============================================
// FETCH STRATEGIEN
// ============================================

// Cache-Größe begrenzen
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxSize) {
    await cache.delete(keys[0]);
    return limitCacheSize(cacheName, maxSize);
  }
}

// Network-First mit Timeout für API
async function networkFirstWithTimeout(request, timeout = 3000) {
  const cache = await caches.open(API_CACHE);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
      await limitCacheSize(API_CACHE, CACHE_CONFIG.maxApiSize);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Bei Timeout oder Netzwerkfehler: Cache verwenden
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log(`[SW ${SW_VERSION}] Using cached API response`);
      return cachedResponse;
    }
    
    // Fallback JSON Response wenn offline
    return new Response(
      JSON.stringify({ error: 'Offline', cached: false }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
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
        limitCacheSize(DYNAMIC_CACHE, CACHE_CONFIG.maxDynamicSize);
      }
      return response;
    })
    .catch((error) => {
      console.log(`[SW ${SW_VERSION}] Network error, using cache`);
      return cachedResponse || caches.match('/offline');
    });
  
  // Sofort aus Cache antworten, aber im Hintergrund aktualisieren
  return cachedResponse || fetchPromise;
}

// Cache-First für statische Assets
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Offline-Fallback
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    throw error;
  }
}

// Cache-First für Bilder mit längerer Cache-Zeit
async function imageCacheFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      await limitCacheSize(IMAGE_CACHE, CACHE_CONFIG.maxImageSize);
    }
    return response;
  } catch (error) {
    // Placeholder-Bild bei Fehler
    return new Response('', { status: 404 });
  }
}

// ============================================
// FETCH EVENT HANDLER
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Nur gleiche Origin behandeln (außer Bilder von externen Quellen)
  if (url.origin !== location.origin && !request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return;
  }
  
  // Chrome Extensions und WebSocket ignorieren
  if (url.protocol === 'chrome-extension:' || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // POST-Requests nicht cachen
  if (request.method !== 'GET') {
    return;
  }
  
  // Routing basierend auf Request-Typ
  
  // 1. API-Calls: Network-First mit Timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithTimeout(request));
    return;
  }
  
  // 2. Bilder: Cache-First mit langem Cache
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(imageCacheFirst(request));
    return;
  }
  
  // 3. Statische Assets (JS, CSS, Fonts): Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // 4. HTML/Navigation: Stale-While-Revalidate
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // 5. Alles andere: Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ============================================
// MESSAGE HANDLER
// ============================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log(`[SW ${SW_VERSION}] Skip waiting requested`);
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      console.log(`[SW ${SW_VERSION}] Clearing all caches`);
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
      break;
      
    case 'GET_VERSION':
      event.source?.postMessage({ type: 'VERSION', version: SW_VERSION });
      break;
      
    case 'CACHE_URLS':
      if (payload?.urls) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.addAll(payload.urls);
        });
      }
      break;
  }
});

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
  console.log(`[SW ${SW_VERSION}] Background sync:`, event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Hier könnten offline Aktionen synchronisiert werden
      Promise.resolve()
    );
  }
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body || 'Neue Benachrichtigung',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Öffnen' },
      { action: 'close', title: 'Schließen' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Member App', options)
  );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Prüfe ob App bereits offen ist
        for (const client of clientList) {
          if (client.url.includes(location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Öffne neues Fenster
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// PERIODIC BACKGROUND SYNC (wenn unterstützt)
// ============================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(
      // Aktualisiere gecachte Inhalte
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.keys().then((requests) => {
          return Promise.all(
            requests.slice(0, 10).map((request) => {
              return fetch(request).then((response) => {
                if (response.ok) {
                  return cache.put(request, response);
                }
              }).catch(() => {});
            })
          );
        });
      })
    );
  }
});

console.log(`[SW ${SW_VERSION}] Service Worker loaded`);
