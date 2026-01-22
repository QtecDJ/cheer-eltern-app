/**
 * Content Cache Management Utilities
 * 
 * ⚠️ WICHTIG: Für Admin/Settings-Seite
 * 
 * FEATURES:
 * - Anzeige Cache-Statistiken
 * - Manuelles Löschen des Content Cache
 * - Logout-Integration (Auto-Clear)
 * - Debug-Informationen
 * 
 * SICHERHEIT:
 * - Cache wird bei Logout automatisch gelöscht
 * - Cache wird bei User-Wechsel gelöscht
 * - Keine sensitiven Daten im Content Cache
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import {
  ContentCacheUtils,
  clearContentCache,
  getContentCacheStats,
  cleanupExpiredContent,
} from '@/lib/content-cache';

// ============================================
// TYPES
// ============================================

export interface CacheManagerState {
  indexedDBAvailable: boolean;
  indexedDBEntries: number;
  localStorageEntries: number;
  isIOS: boolean;
  isPWA: boolean;
  isClearing: boolean;
  lastCleanup: Date | null;
}

// ============================================
// CACHE MANAGER HOOK
// ============================================

/**
 * Hook für Cache-Management
 * 
 * USAGE:
 * ```tsx
 * const {
 *   stats,
 *   clearCache,
 *   cleanupExpired,
 *   refresh,
 * } = useContentCacheManager();
 * ```
 */
export function useContentCacheManager() {
  const [state, setState] = useState<CacheManagerState>({
    indexedDBAvailable: false,
    indexedDBEntries: 0,
    localStorageEntries: 0,
    isIOS: false,
    isPWA: false,
    isClearing: false,
    lastCleanup: null,
  });
  
  /**
   * Lade aktuelle Cache-Stats
   */
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const stats = await getContentCacheStats();
      const isIOS = ContentCacheUtils.isIOSDevice();
      const isPWA = ContentCacheUtils.isIOSPWA();
      
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        indexedDBAvailable: stats.indexedDB.available,
        indexedDBEntries: stats.indexedDB.entries,
        localStorageEntries: stats.localStorage.entries,
        isIOS,
        isPWA,
      }));
    } catch (error) {
      if (!mountedRef.current) return;
      logger.error('[CacheManager] Failed to refresh stats:', error);
    }
  }, []);
  
  /**
   * Lösche gesamten Content Cache
   */
  const clearCache = useCallback(async () => {
    if (!mountedRef.current) return false;
    setState(prev => ({ ...prev, isClearing: true }));
    
    try {
      await clearContentCache('auto');
      
      // Auch Service Worker Content Cache löschen
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const messageChannel = new MessageChannel();
          let timeoutId: number | null = null;
          const promise = new Promise((resolve) => {
            messageChannel.port1.onmessage = (event) => {
              if (!mountedRef.current) return resolve({ success: false });
              resolve(event.data);
            };
            timeoutId = window.setTimeout(() => resolve({ success: false }), 1000) as unknown as number;
          });
          
          navigator.serviceWorker.controller.postMessage(
            { type: 'CLEAR_CONTENT_CACHE' },
            [messageChannel.port2]
          );
          
          await promise;
          if (timeoutId) clearTimeout(timeoutId);
        } catch (error) {
          logger.warn('[CacheManager] Failed to clear SW content cache:', error);
        }
      }
      
      await refresh();
      // cache cleared
      return true;
    } catch (error) {
      if (mountedRef.current) {
        logger.error('[CacheManager] Failed to clear cache:', error);
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, isClearing: false }));
      }
    }
  }, [refresh]);
  
  /**
   * Räume abgelaufene Einträge auf
   */
  const cleanupExpired = useCallback(async () => {
    try {
      await cleanupExpiredContent('auto');
      await refresh();
      if (!mountedRef.current) return false;
      setState(prev => ({
        ...prev,
        lastCleanup: new Date(),
      }));
      
      // expired content cleaned up
      return true;
    } catch (error) {
      if (!mountedRef.current) return false;
      console.error('[CacheManager] Failed to cleanup expired content:', error);
      return false;
    }
  }, [refresh]);
  
  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);
  
  return {
    stats: state,
    clearCache,
    cleanupExpired,
    refresh,
  };
}

// ============================================
// AUTO-CLEAR ON LOGOUT
// ============================================

/**
 * Hook für automatisches Cache-Clearing bei Logout
 * 
 * USAGE (in Root Layout oder Logout Component):
 * ```tsx
 * useContentCacheLogoutHandler();
 * ```
 */
export function useContentCacheLogoutHandler() {
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Prüfe ob Logout-Flag gesetzt ist
      const isLoggingOut = sessionStorage.getItem('logging_out') === 'true';
      
      if (isLoggingOut) {
        // Sync clear (beforeunload erlaubt keine async operations)
        try {
          // localStorage clearing ist sync
          const prefix = 'eltern_content_';
          const keysToDelete: string[] = [];
          
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
              keysToDelete.push(key);
            }
          }
          
          keysToDelete.forEach(key => localStorage.removeItem(key));
          
          // content cache cleared on logout
        } catch (error) {
          logger.warn('[CacheManager] Failed to clear cache on logout:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

/**
 * Funktion zum Setzen des Logout-Flags
 * Sollte in der Logout-Action aufgerufen werden
 */
export function prepareLogoutCacheClear() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('logging_out', 'true');
    
    // Auch async clear versuchen (wird wahrscheinlich nicht fertig vor beforeunload)
    clearContentCache('auto').catch(err => {
      logger.warn('[CacheManager] Async logout cache clear failed:', err);
    });
  }
}

/**
 * Funktion zum Löschen des Logout-Flags (nach erfolgreichem Logout)
 */
export function finishLogoutCacheClear() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('logging_out');
  }
}

// ============================================
// APP INITIALIZATION
// ============================================

/**
 * Hook für App-Initialisierung (Cleanup, etc.)
 * 
 * USAGE (in Root Layout):
 * ```tsx
 * useContentCacheInitialization();
 * ```
 */
export function useContentCacheInitialization() {
  useEffect(() => {
    const initialize = async () => {
      try {
        // Cleanup expired content bei App-Start (iOS-safe)
        await cleanupExpiredContent('auto');
        
        // Log initialization
        const stats = await getContentCacheStats();
          // cache manager initialized
      } catch (error) {
        logger.warn('[CacheManager] Initialization failed:', error);
      }
    };
    
    initialize();
  }, []);
}

// ============================================
// VISIBILITY-BASED CLEANUP (iOS PWA)
// ============================================

/**
 * Hook für iOS PWA: Cleanup bei App Resume
 * 
 * CRITICAL für iOS: visibilitychange ist der einzige zuverlässige Event
 * wenn App aus dem Suspended State zurückkommt
 * 
 * USAGE (in Root Layout):
 * ```tsx
 * useContentCacheVisibilityCleanup();
 * ```
 */
export function useContentCacheVisibilityCleanup() {
  const isIOS = ContentCacheUtils.isIOSDevice();
  const isPWA = ContentCacheUtils.isIOSPWA();
  
  useEffect(() => {
    if (!isIOS || !isPWA) return;
    
    let cleanupTimeout: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App resumed (iOS PWA) - scheduling cleanup
        
        // Debounce cleanup (nicht bei jedem Tab-Switch)
        if (cleanupTimeout) {
          clearTimeout(cleanupTimeout);
        }
        
        cleanupTimeout = setTimeout(() => {
          cleanupExpiredContent('auto').catch(err => {
            logger.warn('[CacheManager] Visibility cleanup failed:', err);
          });
        }, 1000); // 1s delay
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
      }
    };
  }, [isIOS, isPWA]);
}

// ============================================
// UTILITY: FORMAT STATS
// ============================================

/**
 * Formatiere Cache-Stats für Anzeige
 */
export function formatCacheStats(stats: CacheManagerState): {
  storage: string;
  totalEntries: number;
  platform: string;
} {
  const totalEntries = stats.indexedDBEntries + stats.localStorageEntries;
  
  let storage = 'Unknown';
  if (stats.indexedDBAvailable && stats.indexedDBEntries > 0) {
    storage = 'IndexedDB';
  } else if (stats.localStorageEntries > 0) {
    storage = 'localStorage';
  } else {
    storage = 'None';
  }
  
  let platform = 'Desktop';
  if (stats.isIOS) {
    platform = stats.isPWA ? 'iOS PWA' : 'iOS Safari';
  } else if (stats.isPWA) {
    platform = 'PWA';
  }
  
  return {
    storage,
    totalEntries,
    platform,
  };
}

// ============================================
// EXPORT
// ============================================

export const ContentCacheManager = {
  useContentCacheManager,
  useContentCacheLogoutHandler,
  useContentCacheInitialization,
  useContentCacheVisibilityCleanup,
  prepareLogoutCacheClear,
  finishLogoutCacheClear,
  formatCacheStats,
};
