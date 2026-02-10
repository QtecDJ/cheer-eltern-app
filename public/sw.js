 
// Clean, compact Service Worker with IndexedDB-backed content cache
const SW_VERSION = '1.0.0';
const STATIC_CACHE = `static-v${SW_VERSION}`;
const DYNAMIC_CACHE = `dynamic-v${SW_VERSION}`;

// IndexedDB config for content cache
const CONTENT_DB = 'eltern_content_cache_sw';
const CONTENT_STORE = 'content';

// Content endpoints patterns (RegExp strings)
const CONTENT_PATTERNS = [
  /\/api\/events\/.+\/description/,
  /\/api\/announcements\/.+\/content/,
  /\/api\/info\/.*/,
];

function isContentRequest(url) {
  return CONTENT_PATTERNS.some(rx => rx.test(url.pathname));
}

// Simple IndexedDB helpers for SW
function openContentDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CONTENT_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE, { keyPath: 'url' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putContentResponse(url, response) {
  try {
    const db = await openContentDB();
    const tx = db.transaction(CONTENT_STORE, 'readwrite');
    const store = tx.objectStore(CONTENT_STORE);

    const cloned = response.clone();
    const contentType = cloned.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json') || contentType.includes('text/') || contentType.includes('application/')) {
      body = await cloned.text();
    } else {
      // binary fallback
      const buf = await cloned.arrayBuffer();
      body = Array.from(new Uint8Array(buf));
    }

    // Attempt to capture server-provided content version
    let version = cloned.headers.get('x-content-version') || cloned.headers.get('etag') || null;
    try {
      if (!version && contentType.includes('application/json')) {
        const parsed = JSON.parse(body);
        if (parsed && (parsed.version || parsed.updatedAt || parsed.updated_at)) {
          version = parsed.version || parsed.updatedAt || parsed.updated_at;
        }
      }
    } catch (e) {
      /* ignore parse errors */
    }

    const entry = {
      url,
      status: cloned.status,
      statusText: cloned.statusText,
      headers: Array.from(cloned.headers.entries()),
      body,
      version: version || null,
      cachedAt: Date.now(),
    };

    store.put(entry);
    tx.oncomplete = () => db.close();
  } catch (err) {
    // Fail silently; SW should not crash
    console.warn('[SW] putContentResponse failed', err);
  }
}

async function getContentResponse(url) {
  try {
    const db = await openContentDB();
    const tx = db.transaction(CONTENT_STORE, 'readonly');
    const store = tx.objectStore(CONTENT_STORE);
    const req = store.get(url);
    return await new Promise((resolve) => {
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) { resolve(null); db.close(); return; }
        const headers = new Headers();
        (entry.headers || []).forEach(([k, v]) => headers.set(k, v));
        if (entry.version) headers.set('x-content-version', entry.version);

        let body = entry.body;
        if (Array.isArray(body)) {
          // binary
          const u8 = new Uint8Array(body);
          resolve(new Response(u8, { status: entry.status, statusText: entry.statusText, headers }));
        } else {
          resolve(new Response(body, { status: entry.status, statusText: entry.statusText, headers }));
        }
        db.close();
      };
      req.onerror = () => { resolve(null); db.close(); };
    });
  } catch (err) {
    return null;
  }
}

async function clearContentDB() {
  try {
    const db = await openContentDB();
    const tx = db.transaction(CONTENT_STORE, 'readwrite');
    tx.objectStore(CONTENT_STORE).clear();
    tx.oncomplete = () => db.close();
  } catch (err) {
    console.warn('[SW] clearContentDB failed', err);
  }
}

async function contentCacheSize() {
  try {
    const db = await openContentDB();
    const tx = db.transaction(CONTENT_STORE, 'readonly');
    const store = tx.objectStore(CONTENT_STORE);
    const req = store.count();
    const count = await new Promise((resolve) => { req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(0); });
    db.close();
    return count;
  } catch (err) {
    return 0;
  }
}

// Install: pre-cache minimal app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(['/','/offline.html']).catch(()=>{}))
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![STATIC_CACHE, DYNAMIC_CACHE].includes(k)).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch handler with IndexedDB-backed content cache
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Static assets: cache-first
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.match(/\.(js|css|woff|woff2|ttf|eot|png|jpg|jpeg|svg)$/i)) {
    event.respondWith(
      caches.match(request).then(resp => resp || fetch(request).then(f => { caches.open(DYNAMIC_CACHE).then(c=>c.put(request, f.clone())); return f; }).catch(()=>caches.match('/offline.html')))
    );
    return;
  }

  // Content endpoints: try IndexedDB first (stale-while-revalidate)
  if (isContentRequest(url)) {
    event.respondWith((async () => {
      const cached = await getContentResponse(request.url);
      const networkPromise = fetch(request).then(async (networkResp) => {
        if (networkResp && networkResp.ok) {
          putContentResponse(request.url, networkResp).catch(()=>{});
        }
        return networkResp;
      }).catch(()=>null);

      // Return cached if available immediately, else wait for network
      return cached || (await networkPromise) || new Response('','',{status:503,statusText:'Service Unavailable'});
    })());
    return;
  }

  // Navigation / HTML: stale-while-revalidate via cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request).then(resp => { caches.open(DYNAMIC_CACHE).then(c=>c.put(request, resp.clone())); return resp; }).catch(()=>null);
        return cached || network || caches.match('/offline.html');
      })
    );
    return;
  }

  // Fallback: network then cache
  event.respondWith(fetch(request).catch(()=>caches.match(request)));
});

// Message handler for content cache management
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') return self.skipWaiting();
  if (type === 'CLEAR_CONTENT_CACHE') {
    event.waitUntil(clearContentDB());
    if (event.ports && event.ports[0]) event.ports[0].postMessage({ success: true });
  }
  if (type === 'GET_CONTENT_CACHE_SIZE') {
    event.waitUntil((async () => {
      const size = await contentCacheSize();
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ success: true, size });
    })());
  }
});

// ============= PUSH NOTIFICATION HANDLING =============
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  let payload = { title: 'Neue Benachrichtigung', body: '', url: '/' };
  
  if (event.data) {
    try {
      payload = event.data.json();
      console.log('[SW] Push payload:', payload);
    } catch (e) {
      payload.body = event.data.text();
      console.log('[SW] Push text:', payload.body);
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-96x96.png',
    data: { url: payload.url || '/' },
    vibrate: [200, 100, 200],
    tag: 'notification-' + Date.now(),
    requireInteraction: false,
    silent: false,
  };

  console.log('[SW] Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
      .then(() => console.log('[SW] Notification shown successfully'))
      .catch(err => console.error('[SW] Error showing notification:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
// ============= END PUSH HANDLING =============

// SW initialized
