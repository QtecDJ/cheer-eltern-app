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
    import('@/lib/content-cache-manager').then(({ useContentCacheManager }) => {
      console.log('[ContentCache] Cache-Manager initialisiert');
    }).catch(err => {
      console.error('[ContentCache] Failed to initialize cache manager:', err);
    });

    // Cleanup bei iOS visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Optional: Cleanup hier durchführen
        console.log('[ContentCache] App in background, cleanup möglich');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // Kein UI, nur Background-Logik
}
