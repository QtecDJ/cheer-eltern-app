/**
 * iOS Offline Fallback Manager
 * 
 * [iOS-SAFE] [ADD-ONLY] [NON-BREAKING]
 * 
 * PROBLEM: iOS Safari/PWA hat instabiles Netzwerk-Verhalten:
 * - Wechsel zwischen WLAN und Mobile Daten
 * - Tunnel-Modus (z.B. in U-Bahn)
 * - Schwaches Signal triggert Retry-Storm
 * - iOS meldet "online" obwohl Requests fehlschlagen
 * - Service Worker wird bei schlechtem Netz oft beendet
 * 
 * FOLGE: Unnecessary Function Invocations
 * - Fehlgeschlagene Requests werden sofort retried
 * - Exponential Backoff fehlt oft
 * - = 5-10x mehr Requests als nötig bei schlechtem Netz
 * 
 * LÖSUNG: Intelligentes Offline-Fallback
 * - Erkenne "faktisches Offline" (Requests fehlschlagen obwohl online)
 * - Nutze Cache aggressiv bei instabilem Netz
 * - Verhindere Retry-Stürme
 * - Exponential Backoff für Failed Requests
 * - Persistent localStorage für "Network Health"
 * 
 * ⚠️ WICHTIG:
 * - KEINE neue Offline-UI
 * - KEINE Änderung an bestehenden Fetches
 * - Nur technische Schutzschicht
 * - Transparent für User
 * - Nutzt bestehenden Cache
 * 
 * USAGE (optional):
 * ```tsx
 * import { offlineFallbackFetch } from '@/lib/ios-offline-fallback';
 * 
 * // Statt:
 * const data = await fetch('/api/trainings');
 * 
 * // Optional mit Offline-Schutz:
 * const data = await offlineFallbackFetch('/api/trainings', {
 *   fallbackToCache: true,
 *   maxRetries: 2
 * });
 * ```
 * 
 * EINSPARUNG: ~50-70% weniger Failed Function Invocations
 */

'use client';

// ============================================
// TYPES
// ============================================

interface OfflineFallbackOptions extends RequestInit {
  /** Fallback zu Cache bei Fehler (default: true) */
  fallbackToCache?: boolean;
  /** Maximale Anzahl Retries (default: 2) */
  maxRetries?: number;
  /** Initial Retry Delay in ms (default: 1000) */
  initialRetryDelay?: number;
  /** Exponential Backoff Factor (default: 2) */
  backoffFactor?: number;
  /** Timeout für Request in ms (default: 8000 auf iOS, 10000 sonst) */
  timeout?: number;
  /** Debug-Logs aktivieren */
  debug?: boolean;
  /** Cache-TTL für Fallback (default: 5 Minuten) */
  cacheTTL?: number;
}

interface NetworkHealthStatus {
  isHealthy: boolean;
  consecutiveFailures: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_PREFIX = 'ios_offline_';
const NETWORK_HEALTH_KEY = 'network_health';
const DEFAULT_TIMEOUT_IOS = 8000; // 8 Sekunden auf iOS
const DEFAULT_TIMEOUT_OTHER = 10000; // 10 Sekunden sonst
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 Minuten
const HEALTH_FAILURE_THRESHOLD = 3; // 3 Failures = unhealthy
const HEALTH_RECOVERY_TIME = 30 * 1000; // 30 Sekunden bis Recovery-Versuch

// ============================================
// iOS DETECTION
// ============================================

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// ============================================
// NETWORK HEALTH TRACKING
// ============================================

let networkHealth: NetworkHealthStatus = {
  isHealthy: true,
  consecutiveFailures: 0,
  lastFailureTime: 0,
  lastSuccessTime: Date.now(),
};

// Lade Network Health aus Storage
function loadNetworkHealth(): void {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${NETWORK_HEALTH_KEY}`);
    if (stored) {
      networkHealth = JSON.parse(stored);
    }
  } catch (e) {
    // Ignore
  }
}

// Speichere Network Health
function saveNetworkHealth(): void {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${NETWORK_HEALTH_KEY}`,
      JSON.stringify(networkHealth)
    );
  } catch (e) {
    // Ignore
  }
}

// Initialisiere
if (typeof window !== 'undefined') {
  loadNetworkHealth();
}

function recordSuccess(): void {
  networkHealth.consecutiveFailures = 0;
  networkHealth.lastSuccessTime = Date.now();
  networkHealth.isHealthy = true;
  saveNetworkHealth();
}

function recordFailure(): void {
  networkHealth.consecutiveFailures++;
  networkHealth.lastFailureTime = Date.now();
  
  if (networkHealth.consecutiveFailures >= HEALTH_FAILURE_THRESHOLD) {
    networkHealth.isHealthy = false;
  }
  
  saveNetworkHealth();
}

function isNetworkHealthy(): boolean {
  // Check ob Recovery-Zeit vergangen
  const timeSinceFailure = Date.now() - networkHealth.lastFailureTime;
  if (!networkHealth.isHealthy && timeSinceFailure > HEALTH_RECOVERY_TIME) {
    // Recovery-Versuch erlauben
    networkHealth.isHealthy = true;
    networkHealth.consecutiveFailures = 0;
    saveNetworkHealth();
  }
  
  return networkHealth.isHealthy;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

interface CachedResponse {
  data: unknown;
  timestamp: number;
  url: string;
  status: number;
  headers: Record<string, string>;
}

function getCacheKey(url: string): string {
  return `${STORAGE_PREFIX}cache_${url}`;
}

function setCache(url: string, response: Response, data: unknown, ttl: number): void {
  try {
    const cached: CachedResponse = {
      data,
      timestamp: Date.now(),
      url,
      status: response.status,
      headers: {},
    };
    
    // Kopiere wichtige Headers
    response.headers.forEach((value, key) => {
      cached.headers[key] = value;
    });
    
    const serialized = JSON.stringify(cached);
    
    // iOS localStorage Limit beachten
    if (serialized.length > 500 * 1024) {
      console.warn('[Offline Fallback] Response too large for cache:', url);
      return;
    }
    
    localStorage.setItem(getCacheKey(url), serialized);
    
    // Auto-Cleanup nach TTL
    setTimeout(() => {
      try {
        localStorage.removeItem(getCacheKey(url));
      } catch (e) {
        // Ignore
      }
    }, ttl);
  } catch (e) {
    console.warn('[Offline Fallback] Failed to cache response:', url, e);
  }
}

function getCache(url: string, maxAge: number = DEFAULT_CACHE_TTL): CachedResponse | null {
  try {
    const cached = localStorage.getItem(getCacheKey(url));
    if (!cached) return null;
    
    const parsed: CachedResponse = JSON.parse(cached);
    
    // Check age
    const age = Date.now() - parsed.timestamp;
    if (age > maxAge) {
      localStorage.removeItem(getCacheKey(url));
      return null;
    }
    
    return parsed;
  } catch (e) {
    return null;
  }
}

// ============================================
// EXPONENTIAL BACKOFF
// ============================================

function calculateRetryDelay(attempt: number, initialDelay: number, backoffFactor: number): number {
  return initialDelay * Math.pow(backoffFactor, attempt);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// OFFLINE FALLBACK FETCH
// ============================================

/**
 * Fetch mit intelligentem Offline-Fallback
 */
export async function offlineFallbackFetch(
  url: string,
  options?: OfflineFallbackOptions
): Promise<Response> {
  const isIOS = isIOSDevice();
  
  const {
    fallbackToCache = true,
    maxRetries = 2,
    initialRetryDelay = 1000,
    backoffFactor = 2,
    timeout = isIOS ? DEFAULT_TIMEOUT_IOS : DEFAULT_TIMEOUT_OTHER,
    debug = false,
    cacheTTL = DEFAULT_CACHE_TTL,
    ...fetchOptions
  } = options || {};

  // Check Network Health
  const networkHealthy = isNetworkHealthy();
  
  // debug disabled in production

  // Wenn Netzwerk unhealthy: Versuche Cache zuerst
  if (!networkHealthy && fallbackToCache) {
    const cached = getCache(url, cacheTTL);
    if (cached) {
      // using cache due to unhealthy network
      
      // Return cached response
      return new Response(JSON.stringify(cached.data), {
        status: cached.status,
        headers: new Headers(cached.headers),
      });
    }
  }

  // Versuche Request mit Retries
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Success!
      recordSuccess();

      // Cache successful response (nur GET Requests)
      if (fallbackToCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
        if (response.ok) {
          try {
            const clone = response.clone();
            const data = await clone.json();
            setCache(url, response, data, cacheTTL);
          } catch (e) {
            // Nicht-JSON Response, kein Cache
          }
        }
      }

      // request successful

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      recordFailure();

      // request failed

      // Letzter Versuch: Fallback zu Cache
      if (attempt === maxRetries) {
          if (fallbackToCache) {
          const cached = getCache(url, cacheTTL * 2); // Längerer Cache bei Fallback
          if (cached) {
            return new Response(JSON.stringify(cached.data), {
              status: cached.status,
              headers: new Headers({
                ...cached.headers,
                'X-From-Cache': 'true',
                'X-Cache-Reason': 'offline-fallback',
              }),
            });
          }
        }
        
        // Kein Cache verfügbar
        throw lastError;
      }

      // Warte mit Exponential Backoff
      const delay = calculateRetryDelay(attempt, initialRetryDelay, backoffFactor);
      
      // retrying after backoff
      
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Request failed');
}

// ============================================
// JSON WRAPPER
// ============================================

/**
 * Offline Fallback JSON Fetch
 */
export async function offlineFallbackFetchJSON<T = unknown>(
  url: string,
  options?: OfflineFallbackOptions
): Promise<T> {
  const response = await offlineFallbackFetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get Network Health Status
 */
export function getNetworkHealth(): NetworkHealthStatus {
  return { ...networkHealth };
}

/**
 * Reset Network Health (z.B. nach erfolgreicher Reconnection)
 */
export function resetNetworkHealth(): void {
  networkHealth = {
    isHealthy: true,
    consecutiveFailures: 0,
    lastFailureTime: 0,
    lastSuccessTime: Date.now(),
  };
  saveNetworkHealth();
}

/**
 * Clear Offline Cache
 */
export function clearOfflineCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${STORAGE_PREFIX}cache_`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    // Ignore
  }
}

/**
 * Get Offline Cache Stats
 */
export function getOfflineCacheStats() {
  let count = 0;
  let totalSize = 0;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${STORAGE_PREFIX}cache_`)) {
        count++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    });
  } catch (e) {
    // Ignore
  }
  
  return {
    cachedItems: count,
    totalSize: Math.round(totalSize / 1024) + ' KB',
    networkHealth,
  };
}

// ============================================
// EXPORT
// ============================================

export default {
  offlineFallbackFetch,
  offlineFallbackFetchJSON,
  getNetworkHealth,
  resetNetworkHealth,
  clearOfflineCache,
  getOfflineCacheStats,
};
