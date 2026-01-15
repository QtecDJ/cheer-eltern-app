/**
 * iOS PWA Optimierungs-Hook
 * 
 * [SAFE] [ADDITIVE] [iOS-SPEZIFISCH]
 * 
 * ZIEL: Reduziere unnötige Re-Fetches bei iOS App-Resume
 * 
 * iOS PROBLEME:
 * 1. App-Resume löst oft kompletten Reload aus
 * 2. Aggressive Cache-Eviction bei niedrigem Speicher
 * 3. Visibility API Events werden mehrfach gefeuert
 * 4. Service Worker wird sofort beendet bei Pause
 * 
 * LÖSUNG:
 * - Debounced Visibility Handler
 * - Persistent localStorage für letzte Fetch-Zeit
 * - Nur neu laden wenn > 2 Min seit letztem Fetch
 * - Sofortige Anzeige gecachter Daten
 * 
 * USAGE in Server Components (optional):
 * ```tsx
 * 'use client'
 * import { useIOSResumeOptimization } from '@/lib/use-ios-resume-optimization';
 * 
 * export function MyContent() {
 *   useIOSResumeOptimization('my-page', () => {
 *     // Wird nur ausgeführt wenn wirklich nötig
 *     router.refresh();
 *   });
 * }
 * ```
 */

'use client';

import { useEffect, useRef } from 'react';

interface IOSResumeOptions {
  /** Mindest-Zeit zwischen Reloads in Millisekunden (default: 120000 = 2 Min) */
  minInterval?: number;
  /** Debounce-Zeit für visibility events in ms (default: 1000) */
  debounceMs?: number;
  /** Debug-Logs aktivieren */
  debug?: boolean;
}

const DEFAULT_MIN_INTERVAL = 2 * 60 * 1000; // 2 Minuten
const DEFAULT_DEBOUNCE = 1000; // 1 Sekunde

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isIOSPWA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isIOSDevice() && ('standalone' in navigator) && (navigator as any).standalone === true;
}

/**
 * Hook zur Optimierung von iOS App-Resume Verhalten
 * Verhindert unnötige Re-Fetches durch intelligentes Debouncing
 */
export function useIOSResumeOptimization(
  key: string,
  onResume: () => void,
  options: IOSResumeOptions = {}
) {
  const {
    minInterval = DEFAULT_MIN_INTERVAL,
    debounceMs = DEFAULT_DEBOUNCE,
    debug = false,
  } = options;

  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastResumeTime = useRef<number>(0);

  useEffect(() => {
    // Nur auf iOS PWA aktiv
    if (!isIOSPWA()) {
      if (debug) console.log('[iOSResume] Not iOS PWA, hook inactive');
      return;
    }

    const storageKey = `ios_resume_${key}`;

    // Lade letzte Resume-Zeit aus localStorage
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        lastResumeTime.current = parseInt(stored, 10);
      }
    } catch (e) {
      // Ignore
    }

    const handleVisibilityChange = () => {
      // Nur bei visible
      if (document.visibilityState !== 'visible') {
        return;
      }

      // Clear vorheriges Debounce
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Debounce: Warte kurz ob weitere Events kommen
      debounceTimeout.current = setTimeout(() => {
        const now = Date.now();
        const timeSinceLastResume = now - lastResumeTime.current;

        if (debug) {
          console.log('[iOSResume]', {
            key,
            timeSinceLastResume: Math.round(timeSinceLastResume / 1000) + 's',
            minInterval: Math.round(minInterval / 1000) + 's',
          });
        }

        // Nur ausführen wenn genug Zeit vergangen
        if (timeSinceLastResume >= minInterval) {
          if (debug) console.log('[iOSResume] Triggering resume action');
          
          lastResumeTime.current = now;
          try {
            localStorage.setItem(storageKey, now.toString());
          } catch (e) {
            // Ignore storage errors
          }

          onResume();
        } else {
          if (debug) console.log('[iOSResume] Skipping resume - too soon');
        }
      }, debounceMs);
    };

    // Listen auf visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [key, onResume, minInterval, debounceMs, debug]);
}

/**
 * Gibt zurück ob gerade ein iOS App-Resume passiert ist
 * Nützlich für conditional rendering
 */
export function useIsIOSResuming(key: string, windowMs: number = 5000): boolean {
  const storageKey = `ios_resume_${key}`;
  
  if (!isIOSPWA()) return false;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return false;

    const lastResume = parseInt(stored, 10);
    const timeSince = Date.now() - lastResume;

    return timeSince < windowMs;
  } catch (e) {
    return false;
  }
}

/**
 * Manuell triggern eines Resume-Events
 * Für custom use-cases
 */
export function triggerIOSResume(key: string): void {
  const storageKey = `ios_resume_${key}`;
  try {
    localStorage.setItem(storageKey, Date.now().toString());
  } catch (e) {
    // Ignore
  }
}
