"use client";

import { useEffect } from "react";

/**
 * Global Content Cache Initialization
 * 
 * Automatische Integration des Content-Caching-Systems:
 * - Initialisiert Cache-Manager beim App-Start
 * - Führt automatisches Cleanup durch
 * - iOS-optimiert mit visibility change handling
 * 
 * WICHTIG: In Layout einbinden für app-weite Funktionalität
 */
export function ContentCacheInit() {
  useEffect(() => {
    // Nur im Browser ausführen
    if (typeof window === 'undefined') return;

    // Lazy load des Cache-Managers um Server-Side Rendering zu vermeiden
    import('@/lib/content-cache-manager').catch(() => {});

    // Sync: read SW IndexedDB ('eltern_content_cache_sw') and populate client content cache
    (async function syncSwContent() {
      try {
        if (!('indexedDB' in window)) return;

        // Open SW DB (name used by SW)
        const req = indexedDB.open('eltern_content_cache_sw', 1);

        req.onupgradeneeded = () => { /* no-op */ };

        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        const tx = db.transaction(['content'], 'readonly');
        const store = tx.objectStore('content');
        const getAllReq = store.getAll();

        const entries: any[] = await new Promise((resolve) => {
          getAllReq.onsuccess = () => resolve(getAllReq.result || []);
          getAllReq.onerror = () => resolve([]);
        });

        if (entries.length === 0) {
          db.close();
          return;
        }

        // Lazy import client content-cache utilities
        const { setContentCache } = await import('@/lib/content-cache');

        const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

        function normalizeKeyFromUrl(fullUrl: string) {
          try {
            const u = new URL(fullUrl);
            const p = u.pathname;
            let m;
            m = p.match(/^\/api\/events\/([^\/]+)\/description$/);
            if (m) return `event-${m[1]}-description`;
            m = p.match(/^\/api\/announcements\/([^\/]+)\/content$/);
            if (m) return `announcement-${m[1]}-content`;
            m = p.match(/^\/api\/info\/(.+)$/);
            if (m) return `info-${m[1]}`;
            // Fallback: sanitize path
            return `url-${p.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')}`;
          } catch (err) {
            return null;
          }
        }

        for (const e of entries) {
          try {
            const url: string = e.url;
            let data: any = e.body;

            // Try to parse JSON bodies
            if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch { /* keep string */ }
            }

            const normalized = normalizeKeyFromUrl(url);
            if (!normalized) continue;

            const cacheKey = `content:${normalized}`; // match getVersionedContent namespace
            const now = Date.now();
            const version = e.version ? String(e.version) : new Date(e.cachedAt || now).toISOString();

            await setContentCache(cacheKey, {
              data,
              version,
              fetchedAt: e.cachedAt || now,
              expiresAt: now + TTL,
            }, 'indexedDB');
          } catch (innerErr) {
            // ignore entry
          }
        }

        db.close();
        // sync complete
      } catch (err) {
        // sync failed
      }
    })();

    // Cleanup bei iOS visibility changes
    const handleVisibilityChange = () => {
      // Optional cleanup on background
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // Kein UI, nur Background-Logik
}
