/**
 * React Hook für Client-Side Caching
 * 
 * ⚠️ WICHTIG: Dieser Hook ist OPTIONAL und nur für Client Components!
 * 
 * Server Components sollten weiterhin die bestehenden optimierten Queries nutzen:
 * - import { getDataFromQueries } from "@/lib/queries";
 * - const data = await getDataFromQueries();
 * 
 * Der Service Worker cached automatisch die Responses von Server Components,
 * daher ist explizites Client-Side Caching dort nicht nötig.
 * 
 * WANN NUTZEN:
 * - Nur in Client Components ("use client")
 * - Wenn du explizite Kontrolle über Caching brauchst
 * - Für dynamische Client-Side Data Fetching
 * 
 * WANN NICHT NUTZEN:
 * - In Server Components (nutze stattdessen @/lib/queries)
 * - Für sensitive Daten (health data, passwords, etc.)
 * - Wenn revalidate in page.tsx ausreicht
 * 
 * BEISPIEL:
 * ```tsx
 * "use client";
 * 
 * const { data, loading, error } = useCachedData(
 *   'events_list',
 *   () => fetch('/api/events').then(r => r.json()),
 *   { ttl: 5 * 60 * 1000 }
 * );
 * ```
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { cacheFirst, getCache, setCache, CacheOptions } from './client-cache';

export interface UseCachedDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isFromCache: boolean;
}

/**
 * Hook for cached data fetching
 * 
 * Features:
 * - Instant load from cache
 * - Background updates
 * - Automatic revalidation
 * - Error handling
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
): UseCachedDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const { enabled = true, ...cacheOptions } = options;

  const loadData = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try cache first
      const cached = await getCache<T>(key, cacheOptions);
      
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        setLoading(false);
        
        // Background update
        fetcher()
          .then((freshData) => {
            setCache(key, freshData, cacheOptions);
            setData(freshData);
            setIsFromCache(false);
          })
          .catch((err) => {
            console.warn(`[useCachedData] Background update failed: ${key}`, err);
          });
      } else {
        // Cache miss - fetch fresh
        const freshData = await fetcher();
        await setCache(key, freshData, cacheOptions);
        setData(freshData);
        setIsFromCache(false);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [key, fetcher, enabled, cacheOptions]);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const freshData = await fetcher();
      await setCache(key, freshData, cacheOptions);
      setData(freshData);
      setIsFromCache(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [key, fetcher, cacheOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refetch, isFromCache };
}

/**
 * Hook for cache-first data (no loading state)
 * Returns cached data immediately if available
 */
export function useCacheFirst<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    cacheFirst(key, fetcher, options).then(setData);
  }, [key, fetcher, options]);

  return data;
}

/**
 * Hook for prefetching data
 * Useful for preloading data that will be needed soon
 */
export function usePrefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { trigger?: boolean } = {}
): void {
  const { trigger = true, ...cacheOptions } = options;

  useEffect(() => {
    if (!trigger) return;
    
    // Check if already cached
    getCache<T>(key, cacheOptions).then((cached) => {
      if (!cached) {
        // Not cached - prefetch
        fetcher()
          .then((data) => setCache(key, data, cacheOptions))
          .catch((err) => console.warn(`[usePrefetch] Failed: ${key}`, err));
      }
    });
  }, [key, fetcher, trigger, cacheOptions]);
}

/**
 * Hook for optimistic updates
 * Update cache immediately, then sync with server
 */
export function useOptimisticUpdate<T>(
  key: string,
  options: CacheOptions = {}
): {
  updateOptimistic: (updater: (current: T | null) => T) => Promise<void>;
  syncWithServer: (fetcher: () => Promise<T>) => Promise<void>;
} {
  const updateOptimistic = useCallback(
    async (updater: (current: T | null) => T) => {
      const current = await getCache<T>(key, options);
      const updated = updater(current);
      await setCache(key, updated, options);
    },
    [key, options]
  );

  const syncWithServer = useCallback(
    async (fetcher: () => Promise<T>) => {
      try {
        const serverData = await fetcher();
        await setCache(key, serverData, options);
      } catch (err) {
        console.warn(`[useOptimisticUpdate] Sync failed: ${key}`, err);
      }
    },
    [key, options]
  );

  return { updateOptimistic, syncWithServer };
}

export default useCachedData;
