/**
 * iOS PWA Optimization Utilities
 * 
 * ⚠️ WICHTIG: Diese Utilities sind ADDITIV zu allen bestehenden Optimierungen!
 * 
 * ÄNDERT NICHT:
 * - Next.js ISR / revalidate (bleibt unverändert)
 * - Prisma Queries (bleibt unverändert)
 * - Service Worker Basic Logic (bleibt bestehen)
 * - Client-Side Cache (wird nur erweitert)
 * 
 * HINZUGEFÜGT:
 * - iOS-spezifische Lifecycle Handling
 * - iOS-safe Cache Strategies
 * - iOS PWA Detection
 * - Resume Performance Optimization
 * 
 * iOS BESONDERHEITEN:
 * - Kein Background Sync
 * - Aggressive Cache Eviction
 * - Service Worker Termination
 * - Limited Storage APIs
 * - PWA Lifecycle Unterschiede
 */

"use client";

// ============================================
// iOS DETECTION
// ============================================

/**
 * Detect if running on iOS Safari
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  const isIOSSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  
  return isIOSDevice || isIOSSafari;
}

/**
 * Detect if running as installed PWA on iOS
 * iOS PWAs run in standalone mode
 */
export function isIOSPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  return isIOS() && (isStandalone || isDisplayStandalone);
}

/**
 * Get iOS version
 */
export function getIOSVersion(): number | null {
  if (!isIOS()) return null;
  
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// ============================================
// iOS CACHE STRATEGIES
// ============================================

/**
 * iOS-safe cache key prefix
 * iOS can evict caches aggressively, so we namespace carefully
 */
const IOS_CACHE_PREFIX = 'ios_pwa_';

/**
 * Check if iOS cache is available
 * iOS can disable localStorage in private mode
 */
export function isIOSCacheAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const test = '__ios_cache_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('[iOS] Cache not available (private mode or disabled)');
    return false;
  }
}

/**
 * iOS-safe localStorage wrapper
 * Falls back gracefully if cache is unavailable
 */
export function setIOSCache(key: string, value: unknown, ttl: number = 5 * 60 * 1000): boolean {
  if (!isIOSCacheAvailable()) return false;
  
  try {
    const item = {
      data: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      ios: true, // Flag for iOS-specific cache
    };
    
    const serialized = JSON.stringify(item);
    
    // iOS localStorage limit is ~5MB, be conservative
    if (serialized.length > 500 * 1024) { // 500KB limit
      console.warn(`[iOS] Cache item too large: ${key} (${serialized.length} bytes)`);
      return false;
    }
    
    localStorage.setItem(`${IOS_CACHE_PREFIX}${key}`, serialized);
    return true;
  } catch (e) {
    console.warn(`[iOS] Failed to set cache: ${key}`, e);
    // iOS might have evicted storage, clear old items
    clearExpiredIOSCache();
    return false;
  }
}

/**
 * iOS-safe localStorage getter
 */
export function getIOSCache<T>(key: string): T | null {
  if (!isIOSCacheAvailable()) return null;
  
  try {
    const cached = localStorage.getItem(`${IOS_CACHE_PREFIX}${key}`);
    if (!cached) return null;
    
    const item = JSON.parse(cached);
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      localStorage.removeItem(`${IOS_CACHE_PREFIX}${key}`);
      return null;
    }
    
    return item.data as T;
  } catch (e) {
    console.warn(`[iOS] Failed to get cache: ${key}`, e);
    return null;
  }
}

/**
 * Clear expired iOS cache entries
 * iOS can be aggressive about storage, help it along
 */
export function clearExpiredIOSCache(): void {
  if (!isIOSCacheAvailable()) return;
  
  try {
    const keys = Object.keys(localStorage);
    let cleared = 0;
    
    keys.forEach((key) => {
      if (key.startsWith(IOS_CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const item = JSON.parse(cached);
            if (Date.now() > item.expiresAt) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch (e) {
          // Corrupted entry, remove it
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });
    
    if (cleared > 0) {
      // cleared expired cache entries
    }
  } catch (e) {
    console.warn('[iOS] Failed to clear expired cache', e);
  }
}

/**
 * Clear all iOS cache
 * Useful on logout or when user switches accounts
 */
export function clearAllIOSCache(): void {
  if (!isIOSCacheAvailable()) return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(IOS_CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    // cleared all iOS cache
  } catch (e) {
    console.warn('[iOS] Failed to clear cache', e);
  }
}

// ============================================
// iOS LIFECYCLE HANDLING
// ============================================

export interface IOSLifecycleCallbacks {
  onLaunch?: () => void;
  onResume?: () => void;
  onPause?: () => void;
  onVisible?: () => void;
  onHidden?: () => void;
}

/**
 * iOS PWA Lifecycle Manager
 * 
 * Handles app launch, resume, pause for iOS PWAs
 * iOS doesn't support Background Sync, so we use visibility API
 */
export class IOSLifecycleManager {
  private callbacks: IOSLifecycleCallbacks;
  private isFirstLaunch: boolean = true;
  private lastVisible: number = Date.now();
  private pauseThreshold: number = 30 * 1000; // 30 seconds = considered paused
  
  constructor(callbacks: IOSLifecycleCallbacks = {}) {
    this.callbacks = callbacks;
    this.init();
  }
  
  private init(): void {
    if (typeof window === 'undefined' || !isIOS()) return;
    
    // App Launch (first load)
    if (this.isFirstLaunch) {
      this.isFirstLaunch = false;
      this.onLaunch();
    }
    
    // Page Visibility (app resume/pause)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Page Focus (iOS PWA specific)
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
    
    // Page Show (back from bfcache - iOS Safari)
    window.addEventListener('pageshow', this.handlePageShow.bind(this));
    
    // lifecycle manager initialized
  }
  
  private onLaunch(): void {
    // app launched
    this.callbacks.onLaunch?.();
    
    // Clear expired cache on launch
    setTimeout(() => clearExpiredIOSCache(), 1000);
  }
  
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // App went to background
      // app hidden
      this.lastVisible = Date.now();
      this.callbacks.onHidden?.();
      this.callbacks.onPause?.();
    } else {
      // App came to foreground
      const pauseDuration = Date.now() - this.lastVisible;
      // app visible
      
      this.callbacks.onVisible?.();
      
      // If app was paused for significant time, trigger resume
      if (pauseDuration > this.pauseThreshold) {
        // app resumed after pause
        this.callbacks.onResume?.();
      }
    }
  }
  
  private handleFocus(): void {
    const pauseDuration = Date.now() - this.lastVisible;
    
    // Only trigger resume if significant pause
    if (pauseDuration > this.pauseThreshold) {
      // window focused after pause
      this.callbacks.onResume?.();
    }
  }
  
  private handleBlur(): void {
    this.lastVisible = Date.now();
    this.callbacks.onPause?.();
  }
  
  private handlePageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      // Page restored from bfcache (iOS Safari)
      const pauseDuration = Date.now() - this.lastVisible;
      // page restored from bfcache
      
      if (pauseDuration > this.pauseThreshold) {
        this.callbacks.onResume?.();
      }
    }
  }
  
  destroy(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('focus', this.handleFocus.bind(this));
    window.removeEventListener('blur', this.handleBlur.bind(this));
    window.removeEventListener('pageshow', this.handlePageShow.bind(this));
  }
}

// ============================================
// iOS NETWORK OPTIMIZATION
// ============================================

/**
 * Track last fetch time to prevent duplicate requests
 * iOS Safari can trigger multiple navigations
 */
const fetchTimestamps = new Map<string, number>();

/**
 * iOS-safe fetch wrapper
 * Prevents duplicate fetches within a short time window
 */
export async function iosSafeFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cacheTTL?: number;
    dedupWindow?: number; // Time window to prevent duplicate fetches
  } = {}
): Promise<T> {
  const {
    cacheTTL = 5 * 60 * 1000, // 5 min default
    dedupWindow = 500, // 500ms dedup window
  } = options;
  
  // 1. Check iOS cache first (instant)
  const cached = getIOSCache<T>(key);
  if (cached) {
    return cached;
  }
  
  // 2. Check deduplication (prevent rapid duplicate fetches)
  const lastFetch = fetchTimestamps.get(key);
  if (lastFetch && Date.now() - lastFetch < dedupWindow) {
    throw new Error('Duplicate fetch prevented');
  }
  
  // 3. Fetch fresh data
  // cache miss - fetching
  fetchTimestamps.set(key, Date.now());
  
  try {
    const data = await fetcher();
    
    // Cache for iOS
    setIOSCache(key, data, cacheTTL);
    
    return data;
  } catch (error) {
    // Remove timestamp on error so retry is allowed
    fetchTimestamps.delete(key);
    throw error;
  }
}

/**
 * iOS resume data revalidation
 * Call this when app resumes from background
 */
export async function revalidateOnResume(keys: string[]): Promise<void> {
  if (!isIOS()) return;
  
  // revalidating keys on resume
  
  // Clear old timestamps to allow fresh fetches
  keys.forEach(key => fetchTimestamps.delete(key));
  
  // Optionally: trigger router.refresh() or similar
  // But only if significant time has passed
}

// ============================================
// iOS SERVICE WORKER HELPERS
// ============================================

/**
 * Send message to Service Worker (iOS-safe)
 * iOS can terminate SW aggressively, handle gracefully
 */
export async function sendToServiceWorker(
  type: string,
  payload?: unknown
): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.active) {
      registration.active.postMessage({ type, payload });
    }
  } catch (error) {
    console.warn('[iOS] Failed to send message to SW', error);
  }
}

/**
 * Request Service Worker to cache URLs
 * Useful for prefetching critical data on iOS
 */
export async function prefetchURLsOnIOS(urls: string[]): Promise<void> {
  if (!isIOS()) return;
  
  await sendToServiceWorker('CACHE_URLS', { urls });
}

// ============================================
// iOS PERFORMANCE MONITORING
// ============================================

export interface IOSPerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  resumeCount: number;
  fetchDedups: number;
  cacheEvictions: number;
}

class IOSPerformanceMonitor {
  private metrics: IOSPerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    resumeCount: 0,
    fetchDedups: 0,
    cacheEvictions: 0,
  };
  
  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }
  
  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }
  
  recordResume(): void {
    this.metrics.resumeCount++;
  }
  
  recordFetchDedup(): void {
    this.metrics.fetchDedups++;
  }
  
  recordCacheEviction(): void {
    this.metrics.cacheEvictions++;
  }
  
  getMetrics(): IOSPerformanceMetrics {
    return { ...this.metrics };
  }
  
  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
  }
  
  reset(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      resumeCount: 0,
      fetchDedups: 0,
      cacheEvictions: 0,
    };
  }
}

export const iosPerformanceMonitor = new IOSPerformanceMonitor();

// ============================================
// UTILITIES
// ============================================

/**
 * Get iOS cache storage estimate
 * iOS has limited storage, monitor usage
 */
export function getIOSCacheSize(): { count: number; sizeKB: number } {
  if (!isIOSCacheAvailable()) {
    return { count: 0, sizeKB: 0 };
  }
  
  let count = 0;
  let totalSize = 0;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(IOS_CACHE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          count++;
          totalSize += item.length;
        }
      }
    });
  } catch (e) {
    console.warn('[iOS] Failed to calculate cache size', e);
  }
  
  return {
    count,
    sizeKB: Math.round(totalSize / 1024),
  };
}

/**
 * iOS storage health check
 * Returns true if storage is healthy
 */
export function checkIOSStorageHealth(): boolean {
  if (!isIOSCacheAvailable()) return false;
  
  const { count, sizeKB } = getIOSCacheSize();
  
  // iOS localStorage is ~5MB, warn if > 80%
  const isNearLimit = sizeKB > 4 * 1024;
  
  if (isNearLimit) {
    console.warn(`[iOS] Storage near limit: ${sizeKB}KB used (${count} items)`);
    clearExpiredIOSCache();
    return false;
  }
  
  return true;
}

// Auto-check storage health on module load
if (typeof window !== 'undefined' && isIOS()) {
  setTimeout(() => {
    checkIOSStorageHealth();
    clearExpiredIOSCache();
  }, 2000);
}

export default {
  isIOS,
  isIOSPWA,
  getIOSVersion,
  isIOSCacheAvailable,
  setIOSCache,
  getIOSCache,
  clearExpiredIOSCache,
  clearAllIOSCache,
  IOSLifecycleManager,
  iosSafeFetch,
  revalidateOnResume,
  sendToServiceWorker,
  prefetchURLsOnIOS,
  iosPerformanceMonitor,
  getIOSCacheSize,
  checkIOSStorageHealth,
};
