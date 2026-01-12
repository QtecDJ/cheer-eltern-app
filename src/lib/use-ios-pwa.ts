/**
 * React Hooks für iOS PWA Features
 * 
 * ⚠️ WICHTIG: Diese Hooks sind ADDITIV und OPTIONAL!
 * Sie ändern NICHTS an bestehenden Server Components oder Queries.
 * 
 * NUTZUNG:
 * - Nur in Client Components
 * - Automatisches iOS Lifecycle Handling
 * - iOS-safe Caching mit Fallbacks
 * - Resume Performance Optimization
 * 
 * BEISPIEL:
 * ```tsx
 * "use client";
 * import { useIOSLifecycle, useIOSCache } from "@/lib/use-ios-pwa";
 * 
 * export function MyComponent() {
 *   useIOSLifecycle({
 *     onResume: () => console.log('App resumed on iOS'),
 *   });
 *   
 *   const data = useIOSCache('key', fetcher);
 *   return <div>{data?.content}</div>;
 * }
 * ```
 */

"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  IOSLifecycleManager,
  IOSLifecycleCallbacks,
  isIOS,
  isIOSPWA,
  iosSafeFetch,
  getIOSCache,
  setIOSCache,
  clearAllIOSCache,
  iosPerformanceMonitor,
  checkIOSStorageHealth,
} from './ios-pwa';

// ============================================
// IOS LIFECYCLE HOOK
// ============================================

/**
 * Hook for iOS PWA Lifecycle handling
 * 
 * Automatically handles app launch, resume, pause on iOS
 * Perfect for triggering data revalidation on resume
 */
export function useIOSLifecycle(callbacks: IOSLifecycleCallbacks = {}): {
  isIOS: boolean;
  isPWA: boolean;
} {
  const [deviceInfo] = useState(() => ({
    isIOS: isIOS(),
    isPWA: isIOSPWA(),
  }));
  
  useEffect(() => {
    if (!deviceInfo.isIOS) return;
    
    const manager = new IOSLifecycleManager(callbacks);
    
    return () => {
      manager.destroy();
    };
  }, [callbacks]);
  
  return deviceInfo;
}

// ============================================
// IOS CACHE HOOK
// ============================================

export interface UseIOSCacheOptions {
  enabled?: boolean;
  cacheTTL?: number;
  revalidateOnResume?: boolean;
  showStaleWhileRevalidate?: boolean;
}

export interface UseIOSCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isFromCache: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for iOS-safe data caching
 * 
 * Features:
 * - iOS-specific cache strategies
 * - Automatic resume revalidation
 * - Stale-while-revalidate pattern
 * - Graceful fallback on iOS cache eviction
 */
export function useIOSCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseIOSCacheOptions = {}
): UseIOSCacheResult<T> {
  const {
    enabled = true,
    cacheTTL = 5 * 60 * 1000,
    revalidateOnResume = true,
    showStaleWhileRevalidate = true,
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  const isMounted = useRef(true);
  const lastFetch = useRef<number>(0);
  
  const fetchData = useCallback(async (silent: boolean = false) => {
    if (!enabled) return;
    
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      
      const result = await iosSafeFetch<T>(key, fetcher, { cacheTTL });
      
      if (isMounted.current) {
        setData(result);
        setIsFromCache(false);
        setLoading(false);
        lastFetch.current = Date.now();
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }
  }, [key, fetcher, enabled, cacheTTL]);
  
  const refetch = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);
  
  // Initial load
  useEffect(() => {
    isMounted.current = true;
    
    // Try cache first
    const cached = getIOSCache<T>(key);
    if (cached && showStaleWhileRevalidate) {
      setData(cached);
      setIsFromCache(true);
      setLoading(false);
      iosPerformanceMonitor.recordCacheHit();
      
      // Background revalidation
      fetchData(true);
    } else {
      if (!cached) {
        iosPerformanceMonitor.recordCacheMiss();
      }
      fetchData(false);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [key, fetchData, showStaleWhileRevalidate]);
  
  // Resume revalidation
  useEffect(() => {
    if (!revalidateOnResume || !isIOS()) return;
    
    const handleResume = () => {
      const timeSinceLastFetch = Date.now() - lastFetch.current;
      
      // Only revalidate if last fetch was > 30 seconds ago
      if (timeSinceLastFetch > 30 * 1000) {
        console.log(`[iOS Hook] Revalidating on resume: ${key}`);
        iosPerformanceMonitor.recordResume();
        fetchData(true); // Silent revalidation
      }
    };
    
    const handleVisible = () => {
      if (document.hidden === false) {
        handleResume();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', handleResume);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', handleResume);
    };
  }, [key, fetchData, revalidateOnResume]);
  
  return { data, loading, error, isFromCache, refetch };
}

// ============================================
// IOS AUTO REVALIDATE HOOK
// ============================================

/**
 * Hook to automatically revalidate data on iOS resume
 * 
 * Use this for pages that need fresh data when user returns to app
 */
export function useIOSAutoRevalidate(
  onRevalidate: () => void | Promise<void>,
  options: {
    enabled?: boolean;
    minPauseDuration?: number; // Minimum pause before triggering revalidation
  } = {}
): void {
  const {
    enabled = true,
    minPauseDuration = 30 * 1000, // 30 seconds
  } = options;
  
  const lastVisible = useRef<number>(Date.now());
  
  useEffect(() => {
    if (!enabled || !isIOS()) return;
    
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        lastVisible.current = Date.now();
      } else {
        const pauseDuration = Date.now() - lastVisible.current;
        
        if (pauseDuration > minPauseDuration) {
          console.log(`[iOS] Auto-revalidating after ${Math.round(pauseDuration / 1000)}s pause`);
          await onRevalidate();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, onRevalidate, minPauseDuration]);
}

// ============================================
// IOS STORAGE HEALTH HOOK
// ============================================

/**
 * Hook to monitor iOS storage health
 * Warns when storage is near limit
 */
export function useIOSStorageHealth(): {
  isHealthy: boolean;
  cacheSize: { count: number; sizeKB: number };
  clearCache: () => void;
} {
  const [isHealthy, setIsHealthy] = useState(true);
  const [cacheSize, setCacheSize] = useState({ count: 0, sizeKB: 0 });
  
  const checkHealth = useCallback(() => {
    if (!isIOS()) return;
    
    const healthy = checkIOSStorageHealth();
    setIsHealthy(healthy);
    
    // Update cache size
    const size = {
      count: 0,
      sizeKB: 0,
    };
    setCacheSize(size);
  }, []);
  
  const clearCache = useCallback(() => {
    clearAllIOSCache();
    checkHealth();
  }, [checkHealth]);
  
  useEffect(() => {
    if (!isIOS()) return;
    
    checkHealth();
    
    // Check periodically
    const interval = setInterval(checkHealth, 60 * 1000); // Every minute
    
    return () => clearInterval(interval);
  }, [checkHealth]);
  
  return { isHealthy, cacheSize, clearCache };
}

// ============================================
// IOS PERFORMANCE METRICS HOOK
// ============================================

/**
 * Hook to access iOS performance metrics
 * Useful for debugging and monitoring
 */
export function useIOSPerformanceMetrics() {
  const [metrics, setMetrics] = useState(() => iosPerformanceMonitor.getMetrics());
  
  useEffect(() => {
    if (!isIOS()) return;
    
    const interval = setInterval(() => {
      setMetrics(iosPerformanceMonitor.getMetrics());
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    metrics,
    hitRate: iosPerformanceMonitor.getCacheHitRate(),
    reset: () => iosPerformanceMonitor.reset(),
  };
}

// ============================================
// IOS NETWORK STATUS HOOK
// ============================================

/**
 * Hook to detect iOS network status
 * iOS can be offline even when showing wifi icon
 */
export function useIOSNetworkStatus(): {
  isOnline: boolean;
  isSlowConnection: boolean;
} {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  
  useEffect(() => {
    if (!isIOS()) return;
    
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    // Check connection type if available
    const checkConnectionSpeed = () => {
      // @ts-ignore - connection API not fully typed
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        // effectiveType: 'slow-2g', '2g', '3g', '4g'
        const slow = ['slow-2g', '2g'].includes(connection.effectiveType);
        setIsSlowConnection(slow);
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', checkConnectionSpeed);
      checkConnectionSpeed();
    }
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if (connection) {
        connection.removeEventListener('change', checkConnectionSpeed);
      }
    };
  }, []);
  
  return { isOnline, isSlowConnection };
}

// ============================================
// IOS PREFETCH HOOK
// ============================================

/**
 * Hook to prefetch data on iOS app start
 * Useful for preloading critical data
 */
export function useIOSPrefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    onlyWhenOnline?: boolean;
    delay?: number;
  } = {}
): void {
  const {
    enabled = true,
    onlyWhenOnline = true,
    delay = 1000,
  } = options;
  
  const { isOnline } = useIOSNetworkStatus();
  const hasPrefetched = useRef(false);
  
  useEffect(() => {
    if (!enabled || !isIOS() || hasPrefetched.current) return;
    if (onlyWhenOnline && !isOnline) return;
    
    const timer = setTimeout(async () => {
      try {
        console.log(`[iOS] Prefetching: ${key}`);
        const data = await fetcher();
        setIOSCache(key, data);
        hasPrefetched.current = true;
      } catch (error) {
        console.warn(`[iOS] Prefetch failed: ${key}`, error);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [key, fetcher, enabled, onlyWhenOnline, isOnline, delay]);
}

export default {
  useIOSLifecycle,
  useIOSCache,
  useIOSAutoRevalidate,
  useIOSStorageHealth,
  useIOSPerformanceMetrics,
  useIOSNetworkStatus,
  useIOSPrefetch,
};
