/**
 * Content Caching System - Version-Based Persistent Storage
 * 
 * ⚠️ WICHTIG: ADDITIV - KEINE ÄNDERUNG AN BESTEHENDEN OPTIMIERUNGEN!
 * Diese Implementierung ist ein zusätzliches Layer über:
 * - Next.js ISR / revalidate (bleibt unverändert) ✅
 * - Prisma Query Optimizations (bleibt unverändert) ✅
 * - Service Worker Basic Caching (bleibt unverändert) ✅
 * - Client-Side Cache aus v1.8.1 (bleibt unverändert) ✅
 * 
 * ZIEL: Version-basiertes Content Caching für Texte & Beschreibungen
 * - Event descriptions, Announcements, Info-Texte
 * - NICHT für: Health Data, Auth Data, Sensitive Information
 * 
 * iOS-SPEZIFISCHE OPTIMIERUNGEN:
 * - Keine Background Sync (iOS beendet SW nach ~3 Sekunden)
 * - Revalidierung nur bei: app launch, app resume, visibilitychange
 * - IndexedDB mit localStorage Fallback
 * - Sofortige Anzeige gecachter Inhalte bei Resume
 * - Graceful Handling von Cache Eviction
 * 
 * ARCHITEKTUR:
 * 1. Version-Check: Vergleiche lokale vs. Server-Version
 * 2. Cache-Hit: Zeige sofort gecachte Inhalte (< 10ms)
 * 3. Cache-Miss oder Outdated: Hole neue Daten, update Cache
 * 4. Storage: IndexedDB (primary), localStorage (fallback)
 * 
 * DATA TRANSFER REDUCTION:
 * - Version-Check: ~50 bytes (statt ~5KB für full content)
 * - Content nur geladen wenn Version ≠ local
 * - Geschätzte Einsparung: 70-90% weniger Transfer für Text Content
 * 
 * EXAMPLE USAGE:
 * ```tsx
 * const content = await getVersionedContent('event-123-description', {
 *   fetcher: () => fetch('/api/events/123/description'),
 *   version: eventLastUpdated.toISOString(),
 *   ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
 * });
 * ```
 */

"use client";

// ============================================
// TYPES
// ============================================

export interface VersionedContent<T = unknown> {
  data: T;
  version: string;
  fetchedAt: number;
  expiresAt: number;
}

export interface ContentCacheOptions {
  /** Version string (ISO timestamp, hash, or version number) */
  version: string;
  /** Time-to-live in milliseconds (default: 7 days for content) */
  ttl?: number;
  /** Storage backend preference */
  storage?: 'indexedDB' | 'localStorage' | 'auto';
  /** Key for namespacing (default: 'content') */
  namespace?: string;
}

export interface VersionCheckResponse {
  version: string;
  hasUpdate: boolean;
}

// ============================================
// CONFIGURATION
// ============================================

const CONTENT_CACHE_CONFIG = {
  // Default TTLs für verschiedene Content-Typen
  TTL_DEFAULT: 7 * 24 * 60 * 60 * 1000, // 7 Tage - Standard für Text Content
  TTL_EVENT_DESCRIPTION: 14 * 24 * 60 * 60 * 1000, // 14 Tage - Event Beschreibungen ändern sich selten
  TTL_ANNOUNCEMENT: 3 * 24 * 60 * 60 * 1000, // 3 Tage - Announcements häufiger aktualisiert
  TTL_INFO_TEXT: 30 * 24 * 60 * 60 * 1000, // 30 Tage - Info-Texte sehr stabil
  
  // iOS-spezifische Anpassungen
  IOS_TTL_MULTIPLIER: 1.0, // Für Content-Cache nutzen wir volle TTL auch auf iOS (Text ändert sich selten)
  
  // Storage Keys
  INDEXEDDB_NAME: 'eltern_content_cache',
  INDEXEDDB_VERSION: 1,
  INDEXEDDB_STORE: 'content',
  LOCALSTORAGE_PREFIX: 'eltern_content_',
  
  // Limits
  MAX_LOCALSTORAGE_ENTRIES: 50, // Maximal 50 Content-Einträge in localStorage
  MAX_INDEXEDDB_ENTRIES: 500, // Maximal 500 Content-Einträge in IndexedDB
};

// ============================================
// iOS DETECTION
// ============================================

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
}

function isIOSPWA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isIOSDevice() && ('standalone' in navigator) && (navigator as any).standalone === true;
}

const IS_IOS = isIOSDevice();
const IS_IOS_PWA = isIOSPWA();

// ============================================
// STORAGE DETECTION
// ============================================

let indexedDBAvailable: boolean | null = null;

async function checkIndexedDBAvailability(): Promise<boolean> {
  if (indexedDBAvailable !== null) return indexedDBAvailable;
  
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    indexedDBAvailable = false;
    return false;
  }
  
  try {
    // Test IndexedDB mit einem kleinen Write/Read
    const testDB = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('_test_db', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('test')) {
          db.createObjectStore('test');
        }
      };
    });
    
    testDB.close();
    indexedDB.deleteDatabase('_test_db');
    
    indexedDBAvailable = true;
    return true;
  } catch (error) {
    console.warn('[ContentCache] IndexedDB not available:', error);
    indexedDBAvailable = false;
    return false;
  }
}

// ============================================
// INDEXEDDB OPERATIONS
// ============================================

let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      CONTENT_CACHE_CONFIG.INDEXEDDB_NAME,
      CONTENT_CACHE_CONFIG.INDEXEDDB_VERSION
    );
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(CONTENT_CACHE_CONFIG.INDEXEDDB_STORE)) {
        const store = db.createObjectStore(CONTENT_CACHE_CONFIG.INDEXEDDB_STORE);
        // Create index für Version-Queries
        store.createIndex('version', 'version', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

async function setIndexedDB<T>(key: string, value: VersionedContent<T>): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_CACHE_CONFIG.INDEXEDDB_STORE], 'readwrite');
    const store = transaction.objectStore(CONTENT_CACHE_CONFIG.INDEXEDDB_STORE);
    const request = store.put(value, key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getIndexedDB<T>(key: string): Promise<VersionedContent<T> | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONTENT_CACHE_CONFIG.INDEXEDDB_STORE], 'readonly');
      const store = transaction.objectStore(CONTENT_CACHE_CONFIG.INDEXEDDB_STORE);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result as VersionedContent<T> | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[ContentCache] IndexedDB get failed:', error);
    return null;
  }
}

async function deleteIndexedDB(key: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_CACHE_CONFIG.INDEXEDDB_STORE], 'readwrite');
    const store = transaction.objectStore(CONTENT_CACHE_CONFIG.INDEXEDDB_STORE);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearIndexedDB(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_CACHE_CONFIG.INDEXEDDB_STORE], 'readwrite');
    const store = transaction.objectStore(CONTENT_CACHE_CONFIG.INDEXEDDB_STORE);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================
// LOCALSTORAGE OPERATIONS (Fallback)
// ============================================

function setLocalStorage<T>(key: string, value: VersionedContent<T>): void {
  try {
    const storageKey = CONTENT_CACHE_CONFIG.LOCALSTORAGE_PREFIX + key;
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.warn('[ContentCache] localStorage set failed:', error);
    // Bei Quota-Exceeded: lösche älteste Einträge
    cleanupLocalStorage();
  }
}

function getLocalStorage<T>(key: string): VersionedContent<T> | null {
  try {
    const storageKey = CONTENT_CACHE_CONFIG.LOCALSTORAGE_PREFIX + key;
    const item = localStorage.getItem(storageKey);
    if (!item) return null;
    return JSON.parse(item) as VersionedContent<T>;
  } catch (error) {
    console.warn('[ContentCache] localStorage get failed:', error);
    return null;
  }
}

function deleteLocalStorage(key: string): void {
  try {
    const storageKey = CONTENT_CACHE_CONFIG.LOCALSTORAGE_PREFIX + key;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn('[ContentCache] localStorage delete failed:', error);
  }
}

function clearLocalStorage(): void {
  try {
    const prefix = CONTENT_CACHE_CONFIG.LOCALSTORAGE_PREFIX;
    const keysToDelete: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('[ContentCache] localStorage clear failed:', error);
  }
}

function cleanupLocalStorage(): void {
  try {
    const prefix = CONTENT_CACHE_CONFIG.LOCALSTORAGE_PREFIX;
    const entries: Array<{ key: string; expiresAt: number }> = [];
    
    // Sammle alle Content-Cache Einträge
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item) as VersionedContent;
            entries.push({ key, expiresAt: parsed.expiresAt });
          } catch {
            // Invalides Item - lösche es
            localStorage.removeItem(key);
          }
        }
      }
    }
    
    // Sortiere nach expiresAt (älteste zuerst)
    entries.sort((a, b) => a.expiresAt - b.expiresAt);
    
    // Lösche älteste Einträge wenn Limit überschritten
    const toDelete = entries.length - CONTENT_CACHE_CONFIG.MAX_LOCALSTORAGE_ENTRIES;
    if (toDelete > 0) {
      entries.slice(0, toDelete).forEach(entry => {
        localStorage.removeItem(entry.key);
      });
      console.log(`[ContentCache] Cleaned up ${toDelete} old localStorage entries`);
    }
  } catch (error) {
    console.warn('[ContentCache] localStorage cleanup failed:', error);
  }
}

// ============================================
// UNIFIED STORAGE API
// ============================================

export async function setContentCache<T>(
  key: string,
  value: VersionedContent<T>,
  preferredStorage: 'indexedDB' | 'localStorage' | 'auto' = 'auto'
): Promise<void> {
  // Auto: versuche IndexedDB, fallback zu localStorage
  if (preferredStorage === 'auto') {
    const hasIndexedDB = await checkIndexedDBAvailability();
    if (hasIndexedDB) {
      try {
        await setIndexedDB(key, value);
        return;
      } catch (error) {
        console.warn('[ContentCache] IndexedDB set failed, falling back to localStorage:', error);
      }
    }
    setLocalStorage(key, value);
  } else if (preferredStorage === 'indexedDB') {
    await setIndexedDB(key, value);
  } else {
    setLocalStorage(key, value);
  }
}

export async function getContentCache<T>(
  key: string,
  preferredStorage: 'indexedDB' | 'localStorage' | 'auto' = 'auto',
  options?: { ignoreExpiry?: boolean }
): Promise<VersionedContent<T> | null> {
  const ignoreExpiry = options?.ignoreExpiry ?? false;
  
  if (preferredStorage === 'auto') {
    const hasIndexedDB = await checkIndexedDBAvailability();
    if (hasIndexedDB) {
      try {
        const result = await getIndexedDB<T>(key);
        // Im Offline-Modus: auch expired caches zurückgeben
        if (result && (ignoreExpiry || result.expiresAt > Date.now())) {
          return result;
        }
      } catch (error) {
        console.warn('[ContentCache] IndexedDB get failed, trying localStorage:', error);
      }
    }
    const lsResult = getLocalStorage<T>(key);
    // Im Offline-Modus: auch expired caches zurückgeben
    if (lsResult && (ignoreExpiry || lsResult.expiresAt > Date.now())) {
      return lsResult;
    }
    return null;
  } else if (preferredStorage === 'indexedDB') {
    const result = await getIndexedDB<T>(key);
    if (result && (ignoreExpiry || result.expiresAt > Date.now())) {
      return result;
    }
    return null;
  } else {
    const result = getLocalStorage<T>(key);
    if (result && (ignoreExpiry || result.expiresAt > Date.now())) {
      return result;
    }
    return null;
  }
}

export async function deleteContentCache(
  key: string,
  preferredStorage: 'indexedDB' | 'localStorage' | 'auto' = 'auto'
): Promise<void> {
  if (preferredStorage === 'auto') {
    const hasIndexedDB = await checkIndexedDBAvailability();
    if (hasIndexedDB) {
      await deleteIndexedDB(key);
    }
    deleteLocalStorage(key);
  } else if (preferredStorage === 'indexedDB') {
    await deleteIndexedDB(key);
  } else {
    deleteLocalStorage(key);
  }
}

export async function clearContentCache(
  preferredStorage: 'indexedDB' | 'localStorage' | 'auto' = 'auto'
): Promise<void> {
  if (preferredStorage === 'auto') {
    const hasIndexedDB = await checkIndexedDBAvailability();
    if (hasIndexedDB) {
      await clearIndexedDB();
    }
    clearLocalStorage();
  } else if (preferredStorage === 'indexedDB') {
    await clearIndexedDB();
  } else {
    clearLocalStorage();
  }
}

// ============================================
// VERSION-BASED CONTENT FETCHING
// ============================================

export interface GetVersionedContentOptions<T> {
  /** Funktion die Content vom Server holt */
  fetcher: () => Promise<T>;
  /** Aktuelle Version vom Server (z.B. lastUpdated timestamp) */
  version: string;
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Storage backend preference */
  storage?: 'indexedDB' | 'localStorage' | 'auto';
  /** Namespace für Cache-Key */
  namespace?: string;
  /** Force refresh (ignore cache) */
  forceRefresh?: boolean;
}

/**
 * Hole Content mit Version-Check
 * 
 * FLOW:
 * 1. Prüfe lokalen Cache
 * 2. Wenn Cache vorhanden und Version === server version: Return cached
 * 3. Sonst: Fetch neu, update cache
 * 
 * iOS OPTIMIZATION:
 * - Zeige gecachten Content sofort (< 10ms)
 * - Kein Background Fetch (iOS beendet SW zu schnell)
 * - Fetch nur wenn tatsächlich benötigt
 * 
 * DATA TRANSFER SAVINGS:
 * - Cached: 0 bytes Transfer
 * - Version-mismatch: Full content (~1-5KB je nach Content)
 * - Durchschnittliche Einsparung: 70-90%
 */
export async function getVersionedContent<T>(
  key: string,
  options: GetVersionedContentOptions<T>
): Promise<T> {
  const {
    fetcher,
    version,
    ttl = CONTENT_CACHE_CONFIG.TTL_DEFAULT,
    storage = 'auto',
    namespace = 'content',
    forceRefresh = false,
  } = options;
  
  const cacheKey = `${namespace}:${key}`;
  const now = Date.now();
  
  // iOS-spezifische TTL-Anpassung (hier 1.0, da Content sich selten ändert)
  const adjustedTTL = IS_IOS ? ttl * CONTENT_CACHE_CONFIG.IOS_TTL_MULTIPLIER : ttl;
  
  // 1. Prüfe Cache (außer bei forceRefresh)
  if (!forceRefresh) {
    const cached = await getContentCache<T>(cacheKey, storage);
    
    if (cached) {
      // Prüfe ob expired
      if (cached.expiresAt > now) {
        // Prüfe Version
        if (cached.version === version) {
          // Cache HIT mit matching version
          console.log(`[ContentCache] ✅ Cache hit with matching version: ${key}`);
          return cached.data;
        } else {
          console.log(`[ContentCache] 🔄 Cache hit but version outdated: ${key} (${cached.version} → ${version})`);
        }
      } else {
        console.log(`[ContentCache] ⏰ Cache expired: ${key}`);
      }
    }
  }
  
  // 2. Cache MISS oder outdated Version - fetch neu
  console.log(`[ContentCache] 📥 Fetching fresh content: ${key}`);
  const freshData = await fetcher();
  
  // 3. Update Cache
  const contentEntry: VersionedContent<T> = {
    data: freshData,
    version,
    fetchedAt: now,
    expiresAt: now + adjustedTTL,
  };
  
  await setContentCache(cacheKey, contentEntry, storage);
  
  return freshData;
}

// ============================================
// CONTENT VERSION UTILITIES
// ============================================

/**
 * Erstelle Version-String aus Datum
 */
export function createVersionFromDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
}

/**
 * Erstelle Version-String aus Hash
 */
export function createVersionFromHash(content: string): string {
  // Einfacher Hash für Version (für Client-Side Version-Generation)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Prüfe ob Version sich geändert hat (ohne full content zu laden)
 */
export async function hasContentVersionChanged(
  key: string,
  serverVersion: string,
  options: { storage?: 'indexedDB' | 'localStorage' | 'auto'; namespace?: string } = {}
): Promise<boolean> {
  const { storage = 'auto', namespace = 'content' } = options;
  const cacheKey = `${namespace}:${key}`;
  
  const cached = await getContentCache(cacheKey, storage);
  
  if (!cached) return true; // Kein Cache = changed
  if (cached.expiresAt < Date.now()) return true; // Expired = changed
  
  return cached.version !== serverVersion;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Lösche abgelaufene Cache-Einträge
 * Sollte bei App-Start ausgeführt werden (iOS-safe)
 */
export async function cleanupExpiredContent(
  storage: 'indexedDB' | 'localStorage' | 'auto' = 'auto'
): Promise<void> {
  if (storage === 'localStorage' || storage === 'auto') {
    cleanupLocalStorage();
  }
  
  // Für IndexedDB: nutze Index
  if (storage === 'indexedDB' || storage === 'auto') {
    const hasIndexedDB = await checkIndexedDBAvailability();
    if (hasIndexedDB) {
      try {
        const db = await getDB();
        const transaction = db.transaction([CONTENT_CACHE_CONFIG.INDEXEDDB_STORE], 'readwrite');
        const store = transaction.objectStore(CONTENT_CACHE_CONFIG.INDEXEDDB_STORE);
        const index = store.index('expiresAt');
        const now = Date.now();
        
        // Query für alle expired entries
        const range = IDBKeyRange.upperBound(now);
        const request = index.openCursor(range);
        
        let deletedCount = 0;
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            if (deletedCount > 0) {
              console.log(`[ContentCache] Cleaned up ${deletedCount} expired IndexedDB entries`);
            }
          }
        };
        
        request.onerror = () => {
          console.warn('[ContentCache] IndexedDB cleanup failed:', request.error);
        };
      } catch (error) {
        console.warn('[ContentCache] IndexedDB cleanup failed:', error);
      }
    }
  }
}

/**
 * Hole Cache-Statistiken
 */
export async function getContentCacheStats(): Promise<{
  indexedDB: { available: boolean; entries: number };
  localStorage: { entries: number };
}> {
  const stats = {
    indexedDB: { available: false, entries: 0 },
    localStorage: { entries: 0 },
  };
  
  // IndexedDB Stats
  const hasIndexedDB = await checkIndexedDBAvailability();
  if (hasIndexedDB) {
    try {
      const db = await getDB();
      const transaction = db.transaction([CONTENT_CACHE_CONFIG.INDEXEDDB_STORE], 'readonly');
      const store = transaction.objectStore(CONTENT_CACHE_CONFIG.INDEXEDDB_STORE);
      const countRequest = store.count();
      
      stats.indexedDB.available = true;
      stats.indexedDB.entries = await new Promise((resolve) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => resolve(0);
      });
    } catch (error) {
      console.warn('[ContentCache] Failed to get IndexedDB stats:', error);
    }
  }
  
  // localStorage Stats
  const prefix = CONTENT_CACHE_CONFIG.LOCALSTORAGE_PREFIX;
  let localStorageEntries = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      localStorageEntries++;
    }
  }
  
  stats.localStorage.entries = localStorageEntries;
  
  return stats;
}

// ============================================
// EXPORT UTILITIES
// ============================================

export const ContentCacheUtils = {
  isIOSDevice,
  isIOSPWA,
  checkIndexedDBAvailability,
  createVersionFromDate,
  createVersionFromHash,
  hasContentVersionChanged,
  cleanupExpiredContent,
  getContentCacheStats,
  clearContentCache,
};

// Log iOS detection on load
if (typeof window !== 'undefined') {
  console.log(`[ContentCache] Initialized - iOS: ${IS_IOS}, PWA: ${IS_IOS_PWA}`);
}
