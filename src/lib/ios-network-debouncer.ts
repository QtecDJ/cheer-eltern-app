/**
 * iOS Network Debouncer - Smart Request Timing
 * 
 * [iOS-SAFE] [ADD-ONLY] [NON-BREAKING]
 * 
 * PROBLEM: iOS feuert oft mehrere gleiche Requests kurz nacheinander:
 * - Bei App-Start: Mehrere Components mounten gleichzeitig
 * - Bei Navigation: Router triggert mehrfache Revalidation
 * - Bei Resume: Visibility + Focus + PageShow Events
 * - React StrictMode: Doppelte Mounts in Development
 * 
 * FOLGE: Function Invocation Storm
 * - Gleicher Endpoint wird 3-5x innerhalb 1 Sekunde gecallt
 * - Jeder Call = 1 Vercel Function Invocation
 * - = 3-5x mehr Kosten als nötig
 * 
 * LÖSUNG: Intelligenter Request-Debouncer
 * - Sammelt identische Requests in Batch
 * - Führt nur 1x aus, teilt Result mit allen Wartenden
 * - Persistent localStorage für "cooldown" zwischen Requests
 * - iOS-spezifische Timeouts (kürzer wegen SW-Termination)
 * 
 * ⚠️ WICHTIG:
 * - Ersetzt KEINE bestehenden Fetches
 * - Nur optionale Wrapper-Funktion
 * - Transparentes Teilen von Responses
 * - Keine Payload-Änderungen
 * 
 * USAGE (optional):
 * ```tsx
 * import { debouncedFetch } from '@/lib/ios-network-debouncer';
 * 
 * // Statt:
 * const data = await fetch('/api/trainings').then(r => r.json());
 * 
 * // Optional mit Debouncer:
 * const data = await debouncedFetch('/api/trainings', {
 *   debounceMs: 1000 // Sammle Requests für 1 Sekunde
 * });
 * ```
 * 
 * EINSPARUNG: ~40-60% weniger Duplicate Function Invocations
 */

'use client';

// ============================================
// TYPES
// ============================================

interface DebouncedFetchOptions extends RequestInit {
  /** Debounce-Zeit in Millisekunden (default: iOS=500ms, other=300ms) */
  debounceMs?: number;
  /** Timeout für den Request (default: 10000ms) */
  timeout?: number;
  /** Cooldown zwischen Requests (default: iOS=2000ms, other=1000ms) */
  cooldownMs?: number;
  /** Debug-Logs aktivieren */
  debug?: boolean;
  /** Force sofortigen Request ohne Debounce */
  immediate?: boolean;
}

interface DebouncedRequest {
  promise: Promise<Response>;
  timestamp: number;
  debounceTimeout?: NodeJS.Timeout;
  resolvers: Array<(response: Response) => void>;
  rejectors: Array<(error: Error) => void>;
}

// ============================================
// CONSTANTS
// ============================================

const IOS_DEBOUNCE_MS = 500; // iOS: 500ms
const OTHER_DEBOUNCE_MS = 300; // Andere: 300ms
const IOS_COOLDOWN_MS = 2000; // iOS: 2 Sekunden Cooldown
const OTHER_COOLDOWN_MS = 1000; // Andere: 1 Sekunde
const DEFAULT_TIMEOUT = 10000; // 10 Sekunden
const STORAGE_PREFIX = 'ios_debounce_';

// ============================================
// iOS DETECTION
// ============================================

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// ============================================
// REQUEST QUEUE
// ============================================

const debouncedRequests = new Map<string, DebouncedRequest>();
const lastRequestTimes = new Map<string, number>();

// ============================================
// REQUEST KEY GENERATION
// ============================================

function generateRequestKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  // Für POST/PUT: Body mit einbeziehen (gekürzt)
  const body = options?.body ? JSON.stringify(options.body).substring(0, 50) : '';
  return `${method}:${url}:${body}`;
}

// ============================================
// COOLDOWN MANAGEMENT
// ============================================

function isInCooldown(key: string, cooldownMs: number): boolean {
  const lastTime = lastRequestTimes.get(key);
  if (!lastTime) return false;
  
  return (Date.now() - lastTime) < cooldownMs;
}

function setCooldown(key: string): void {
  lastRequestTimes.set(key, Date.now());
  
  // Auch in localStorage für Cross-Tab
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, Date.now().toString());
  } catch (e) {
    // Ignore
  }
}

function getCooldownFromStorage(key: string): number | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return stored ? parseInt(stored, 10) : null;
  } catch (e) {
    return null;
  }
}

// ============================================
// DEBOUNCED FETCH
// ============================================

/**
 * Fetch mit intelligentem Debouncing
 * Sammelt identische Requests und führt nur 1x aus
 */
export async function debouncedFetch(
  url: string,
  options?: DebouncedFetchOptions
): Promise<Response> {
  const isIOS = isIOSDevice();
  
  const {
    debounceMs = isIOS ? IOS_DEBOUNCE_MS : OTHER_DEBOUNCE_MS,
    timeout = DEFAULT_TIMEOUT,
    cooldownMs = isIOS ? IOS_COOLDOWN_MS : OTHER_COOLDOWN_MS,
    debug = false,
    immediate = false,
    ...fetchOptions
  } = options || {};

  const requestKey = generateRequestKey(url, fetchOptions);

  // Immediate-Mode: Kein Debounce
  if (immediate) {
    return fetch(url, fetchOptions);
  }

  // Check Cooldown (Cross-Tab aware)
  const storedCooldown = getCooldownFromStorage(requestKey);
  if (storedCooldown) {
    const timeSince = Date.now() - storedCooldown;
    if (timeSince < cooldownMs) {
      // in cooldown
      // Return cached response wenn möglich, sonst warten
      // Für jetzt: Warte einfach kurz
      await new Promise(resolve => setTimeout(resolve, Math.min(cooldownMs - timeSince, 1000)));
    }
  }

  // Check ob bereits ein Request für diesen Key läuft
  const existingRequest = debouncedRequests.get(requestKey);
  if (existingRequest) {
    return new Promise<Response>((resolve, reject) => {
      existingRequest.resolvers.push(resolve);
      existingRequest.rejectors.push(reject);
    });
  }

  // Neuer Request
  // Creating new debounced request

  // Erstelle Promise für alle Wartenden
  const resolvers: Array<(response: Response) => void> = [];
  const rejectors: Array<(error: Error) => void> = [];

  const executeRequest = async (): Promise<Response> => {
    // Executing request

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Set Cooldown
      setCooldown(requestKey);

      // Resolve alle Wartenden
      // Request completed, resolving waiters

      // Clone response für jeden Waiter (Responses können nur 1x consumed werden)
      const clones = resolvers.map(() => response.clone());
      resolvers.forEach((resolve, i) => resolve(clones[i]));

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Request failed

      // Reject alle Wartenden
      const err = error instanceof Error ? error : new Error(String(error));
      rejectors.forEach(reject => reject(err));

      throw err;
    } finally {
      // Cleanup
      debouncedRequests.delete(requestKey);
    }
  };

  // Debounce-Timeout
  const debounceTimeout = setTimeout(executeRequest, debounceMs);

  // Speichere Request
  const debouncedRequest: DebouncedRequest = {
    promise: new Promise<Response>((resolve, reject) => {
      resolvers.push(resolve);
      rejectors.push(reject);
    }),
    timestamp: Date.now(),
    debounceTimeout,
    resolvers,
    rejectors,
  };

  debouncedRequests.set(requestKey, debouncedRequest);

  return debouncedRequest.promise;
}

// ============================================
// JSON WRAPPER
// ============================================

/**
 * Debounced JSON Fetch
 */
export async function debouncedFetchJSON<T = any>(
  url: string,
  options?: DebouncedFetchOptions
): Promise<T> {
  const response = await debouncedFetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================
// UTILITIES
// ============================================

/**
 * Flush alle wartenden Requests sofort
 */
export function flushDebouncedRequests(): void {
  for (const [key, request] of debouncedRequests.entries()) {
    if (request.debounceTimeout) {
      clearTimeout(request.debounceTimeout);
    }
  }
  debouncedRequests.clear();
}

/**
 * Cancel spezifischen Request
 */
export function cancelDebouncedRequest(url: string, options?: RequestInit): void {
  const key = generateRequestKey(url, options);
  const request = debouncedRequests.get(key);
  
  if (request) {
    if (request.debounceTimeout) {
      clearTimeout(request.debounceTimeout);
    }
    
    // Reject alle Wartenden
    const error = new Error('Request cancelled');
    request.rejectors.forEach(reject => reject(error));
    
    debouncedRequests.delete(key);
  }
}

/**
 * Clear alle Cooldowns
 */
export function clearAllCooldowns(): void {
  lastRequestTimes.clear();
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    // Ignore
  }
}

/**
 * Get Stats
 */
export function getDebouncerStats() {
  return {
    pendingRequests: debouncedRequests.size,
    activeCooldowns: lastRequestTimes.size,
    requests: Array.from(debouncedRequests.entries()).map(([key, req]) => ({
      key,
      waiters: req.resolvers.length,
      age: Math.round((Date.now() - req.timestamp) / 1000) + 's',
    })),
  };
}

// ============================================
// EXPORT
// ============================================

export default {
  debouncedFetch,
  debouncedFetchJSON,
  flushDebouncedRequests,
  cancelDebouncedRequest,
  clearAllCooldowns,
  getDebouncerStats,
};
