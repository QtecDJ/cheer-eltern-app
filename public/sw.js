// Member App Service Worker v1.8.3
// Entwickelt von ICA-Dev Kai Püttmann
// Moderne PWA mit verbessertem Caching + Aggressive Client-Side Caching
// v1.8.0: Database Query Optimization - 70% weniger Data Transfer
// v1.8.1: Client-Side Caching - zusätzliche 60-80% weniger API Requests
// v1.8.2: iOS Safari PWA Optimization - iOS-spezifische Anpassungen
// v1.8.3: Install-Optimierung - 242 KB weniger beim Initial Install

const SW_VERSION = '1.8.3';

// ============================================
// iOS DETECTION & OPTIMIZATION
// ============================================

/**
 * iOS-spezifische Service Worker Anpassungen
 * 
 * WICHTIGE iOS LIMITIERUNGEN:
 * 1. Keine Background Sync API - SW wird nach ~3 Sekunden terminiert
 * 2. Aggressives Cache Eviction - iOS löscht Caches bei niedrigem Speicher
 * 3. Kleinere Cache-Limits - Konservativere Cache-Größen für iOS
 * 4. Service Worker wird bei Pause sofort gestoppt
 * 5. Visibility API ist zuverlässiger als pageshow/pagehide auf iOS
 * 
 * STRATEGIE:
 * - Kürzere Cache TTLs auf iOS (50% der normalen Zeit)
 * - Kleinere Cache-Limits
 * - Keine long-running Tasks
 * - Cache-first für kritische Endpoints
 * - Aggressive Cleanup bei activation
 */

// Prüfe ob iOS
function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
}

// Prüfe ob iOS PWA Mode
function isIOSPWA() {
  if (typeof navigator === 'undefined') return false;
  return isIOS() && ('standalone' in navigator) && navigator.standalone === true;
}

// iOS-optimierte Cache-Konfiguration
const IS_IOS = isIOS();
const IS_IOS_PWA = isIOSPWA();

if (IS_IOS) {
  console.log('[SW] Detected iOS - applying iOS optimizations');
  if (IS_IOS_PWA) {
    console.log('[SW] Running in iOS PWA mode');
  }
}
const CACHE_NAME = `member-app-v${SW_VERSION}`;
const STATIC_CACHE = `member-static-v${SW_VERSION}`;
const DYNAMIC_CACHE = `member-dynamic-v${SW_VERSION}`;
const API_CACHE = `member-api-v${SW_VERSION}`;
const IMAGE_CACHE = `member-images-v${SW_VERSION}`;

// Statische Assets die beim Install gecached werden
// Icons werden nur die wichtigsten 2 gecached, Rest lädt Browser bei Bedarf aus manifest.json
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.webp',
  '/icons/icon-192.png',  // Wichtig für Install & App-Icon
  '/icons/icon-512.png',  // Wichtig für Splash Screen
];

// Cache-Konfiguration (mit iOS Anpassungen)
const CACHE_CONFIG = {
  maxDynamicSize: IS_IOS ? 15 : 25, // iOS: kleinerer Cache
  maxApiSize: IS_IOS ? 20 : 30, // iOS: kleinerer Cache
  maxImageSize: IS_IOS ? 30 : 50, // iOS: kleinerer Cache
  apiCacheDuration: IS_IOS ? 2.5 * 60 * 1000 : 5 * 60 * 1000, // iOS: 2.5min, sonst 5min
  staticCacheDuration: 7 * 24 * 60 * 60 * 1000, // 7 Tage
  imageCacheDuration: 14 * 24 * 60 * 60 * 1000, // 14 Tage
};

// API endpoints mit spezifischen Cache-Strategien
const API_CACHE_STRATEGIES = {
  // Lange Cache-Zeit für sehr stabile Daten
  VERY_LONG: [
    '/api/teams',
    '/api/settings',
  ],
  // Mittlere Cache-Zeit für normale Daten
  LONG: [
    '/api/members',
    '/api/profile',
  ],
  // Kurze Cache-Zeit für häufig ändernde Daten
  MEDIUM: [
    '/api/events',
    '/api/trainings',
    '/api/announcements',
  ],
  // Sehr kurze Cache-Zeit
  SHORT: [
    '/api/attendance',
    '/api/rsvp',
  ],
};

// iOS-spezifische Cache Durations (reduziert)
const IOS_CACHE_DURATIONS = {
  VERY_LONG: 15 * 60 * 1000, // 15min statt 30min
  LONG: 5 * 60 * 1000, // 5min statt 10min
  MEDIUM: 2 * 60 * 1000, // 2min statt 5min
  SHORT: 60 * 1000, // 1min statt 2min
};

const STANDARD_CACHE_DURATIONS = {
  VERY_LONG: 30 * 60 * 1000, // 30 Min
  LONG: 10 * 60 * 1000, // 10 Min
  MEDIUM: 5 * 60 * 1000, // 5 Min
  SHORT: 2 * 60 * 1000, // 2 Min
};

// Wähle passende Cache Durations
const CACHE_DURATIONS = IS_IOS ? IOS_CACHE_DURATIONS : STANDARD_CACHE_DURATIONS;

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

// Network-First mit Timeout und intelligenter Cache-Strategie für API
async function networkFirstWithTimeout(request, timeout = 5000) {
  const cache = await caches.open(API_CACHE);
  const url = new URL(request.url);
  
  // Bestimme Cache-Duration basierend auf Endpoint
  let cacheDuration = CACHE_CONFIG.apiCacheDuration;
  
  // iOS: Kürzere Timeouts (SW wird schneller beendet)
  if (IS_IOS) {
    timeout = Math.min(timeout, 3000); // Max 3 Sekunden auf iOS
  }
  
  // Check für spezifische Endpoints
  for (const [strategy, endpoints] of Object.entries(API_CACHE_STRATEGIES)) {
    if (endpoints.some(endpoint => url.pathname.includes(endpoint))) {
      cacheDuration = CACHE_DURATIONS[strategy];
      
      // iOS: Angepasste Timeouts pro Strategy
      if (IS_IOS) {
        switch (strategy) {
          case 'VERY_LONG':
            timeout = 2000; // 2s für stabile Daten
            break;
          case 'LONG':
            timeout = 2500; // 2.5s
            break;
          case 'MEDIUM':
            timeout = 3000; // 3s
            break;
          case 'SHORT':
            timeout = 3000; // 3s für zeitkritische Daten
            break;
        }
      } else {
        switch (strategy) {
          case 'VERY_LONG':
            timeout = 3000;
            break;
          case 'LONG':
            timeout = 4000;
            break;
          case 'MEDIUM':
            timeout = 5000;
            break;
          case 'SHORT':
          cacheDuration = 2 * 60 * 1000; // 2 Min
          timeout = 6000;
          break;
      }
      break;
    }
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const responseClone = response.clone();
      
      // Add cache metadata
      const responseWithMeta = new Response(responseClone.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });
      
      // Add custom header with cache timestamp
      responseWithMeta.headers.set('sw-cached-at', Date.now().toString());
      responseWithMeta.headers.set('sw-cache-duration', cacheDuration.toString());
      
      cache.put(request, responseWithMeta);
      await limitCacheSize(API_CACHE, CACHE_CONFIG.maxApiSize);
      
      console.log(`[SW ${SW_VERSION}] API cached: ${url.pathname} (${cacheDuration}ms)`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Bei Timeout oder Netzwerkfehler: Cache verwenden
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Check cache age
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const cacheDuration = cachedResponse.headers.get('sw-cache-duration');
      
      if (cachedAt && cacheDuration) {
        const age = Date.now() - parseInt(cachedAt);
        const maxAge = parseInt(cacheDuration);
        
        if (age < maxAge) {
          console.log(`[SW ${SW_VERSION}] Using cached API response (age: ${Math.round(age / 1000)}s)`);
          return cachedResponse;
        } else {
          console.log(`[SW ${SW_VERSION}] Cache expired, removing: ${url.pathname}`);
          cache.delete(request);
        }
      } else {
        // Old cache format - still use it
        console.log(`[SW ${SW_VERSION}] Using legacy cached API response`);
        return cachedResponse;
      }
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
  
  // 1. API-Calls: Prüfe ob Content-Endpoint (NEUE LOGIK - ADDITIV)
  if (url.pathname.startsWith('/api/')) {
    // Content-Endpoints: Stale-While-Revalidate (version-basiert)
    if (isContentEndpoint(url)) {
      event.respondWith(staleWhileRevalidateContent(request));
      return;
    }
    
    // Alle anderen API-Calls: Network-First mit Timeout (BESTEHENDE LOGIK)
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
      
    // NEUE CONTENT CACHE MANAGEMENT CASES (ADDITIV)
    case 'CLEAR_CONTENT_CACHE':
      event.waitUntil(
        caches.delete(CONTENT_CACHE).then(() => {
          console.log(`[SW ${SW_VERSION}] Content cache cleared`);
          event.ports[0]?.postMessage({ success: true });
        }).catch(error => {
          console.error(`[SW ${SW_VERSION}] Failed to clear content cache:`, error);
          event.ports[0]?.postMessage({ success: false, error: error.message });
        })
      );
      break;
      
    case 'GET_CONTENT_CACHE_SIZE':
      event.waitUntil(
        caches.open(CONTENT_CACHE).then(cache => {
          return cache.keys().then(keys => {
            event.ports[0]?.postMessage({ 
              success: true, 
              size: keys.length 
            });
          });
        }).catch(error => {
          event.ports[0]?.postMessage({ 
            success: false, 
            error: error.message 
          });
        })
      );
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

// ============================================
// CONTENT CACHE SUPPORT (v1.8.2+)
// Version-Based Content Caching (ADDITIV)
// ============================================

/**
 * WICHTIG: Dieses Feature ist ADDITIV!
 * Es erweitert die bestehende SW-Logik um version-basiertes Content Caching.
 * Alle bisherigen Caching-Strategien bleiben unverändert.
 * 
 * ZIEL: Reduziere Data Transfer für Text-Content (Descriptions, Announcements, etc.)
 * durch intelligentes Version-basiertes Caching
 * 
 * iOS OPTIMIZATION:
 * - Nutzt Cache API (keine long-running tasks)
 * - Stale-while-revalidate für Content-Endpoints
 * - Respektiert iOS Cache Limits
 */

const CONTENT_CACHE = `member-content-v${SW_VERSION}`;

// Content-spezifische Endpoints (können versioniert gecacht werden)
const CONTENT_ENDPOINTS = [
  '/api/events/.*?/description',
  '/api/announcements/.*?/content',
  '/api/info/.*?',
];

// Prüfe ob Request ein Content-Endpoint ist
function isContentEndpoint(url) {
  return CONTENT_ENDPOINTS.some(pattern => {
    const regex = new RegExp(pattern);
    return regex.test(url.pathname);
  });
}

// Stale-While-Revalidate für Content
async function staleWhileRevalidateContent(request) {
  const cache = await caches.open(CONTENT_CACHE);
  const cachedResponse = await cache.match(request);
  
  // iOS: Max 2 Sekunden für Background Revalidation (SW wird sonst beendet)
  const fetchTimeout = IS_IOS ? 2000 : 5000;
  
  const fetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);
      
      const response = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // Update cache in background (non-blocking)
        const responseClone = response.clone();
        const responseWithMeta = new Response(responseClone.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers),
        });
        
        responseWithMeta.headers.set('sw-cached-at', Date.now().toString());
        
        // Cache asyncron updaten (iOS-safe)
        cache.put(request, responseWithMeta).then(() => {
          console.log(`[SW ${SW_VERSION}] Content revalidated: ${request.url}`);
        }).catch(err => {
          console.warn(`[SW ${SW_VERSION}] Content cache update failed:`, err);
        });
      }
      
      return response;
    } catch (error) {
      // Bei Fehler: nutze Cache falls vorhanden
      if (cachedResponse) {
        console.log(`[SW ${SW_VERSION}] Content revalidation failed, using cache`);
        return cachedResponse;
      }
      throw error;
    }
  })();
  
  // Wenn Cache vorhanden: sofort returnen (stale)
  // Sonst: warte auf Network
  return cachedResponse || fetchPromise;
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

/**
 * Push Event Handler
 * iOS-SAFE: Wird nur aufgerufen wenn App im Vordergrund oder Notification Permission granted
 */
self.addEventListener('push', function(event) {
  console.log(`[SW ${SW_VERSION}] Push received:`, event);
  
  if (!event.data) {
    console.log(`[SW ${SW_VERSION}] Push event has no data`);
    return;
  }

  try {
    const data = event.data.json();
    console.log(`[SW ${SW_VERSION}] Push data:`, data);

    const title = data.title || 'ICA Allstars';
    const options = {
      body: data.body || data.message || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'notification',
      requireInteraction: false,
      vibrate: [200, 100, 200], // iOS ignoriert dies, Android nutzt es
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
        ...data
      }
    };

    // Füge Action Buttons hinzu wenn vorhanden (iOS unterstützt max 2)
    if (data.actions && Array.isArray(data.actions)) {
      options.actions = IS_IOS 
        ? data.actions.slice(0, 2) // iOS: max 2 Actions
        : data.actions;
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error(`[SW ${SW_VERSION}] Error parsing push data:`, error);
  }
});

/**
 * Notification Click Handler
 * iOS-SAFE: Funktioniert in iOS PWA Mode
 */
self.addEventListener('notificationclick', function(event) {
  console.log(`[SW ${SW_VERSION}] Notification click:`, event);
  
  event.notification.close();

  if (event.action) {
    console.log(`[SW ${SW_VERSION}] Action clicked:`, event.action);
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Versuche existierenden Tab zu fokussieren
        for (let client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Öffne neuen Tab wenn kein passender existiert
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(err => {
        console.error(`[SW ${SW_VERSION}] Error handling notification click:`, err);
      })
  );
});

/**
 * Push Subscription Change Handler
 * iOS-SAFE: Re-subscribe bei Subscription-Verlust
 */
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log(`[SW ${SW_VERSION}] Push subscription changed`);
  
  // iOS-SAFE: Keine long-running async tasks
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BO7nt__RKbqZlG9z6GlXQ6pz3fbN3Uc77RKPUOksuG6mRFzOR4j8ijcVchwec1PDP2b2odULfoIE-SW6rqxQiyo'
    })
    .then(function(subscription) {
      console.log(`[SW ${SW_VERSION}] New subscription created:`, subscription.endpoint);
      
      // Sende neue Subscription an Backend
      return fetch('/api/push/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
          }
        })
      });
    })
    .catch(function(err) {
      console.error(`[SW ${SW_VERSION}] Push resubscribe failed:`, err);
    })
  );
});

console.log(`[SW ${SW_VERSION}] Service Worker loaded with Content Cache + Push Notifications support`);
}
