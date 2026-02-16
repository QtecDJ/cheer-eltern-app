"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, X, Wifi, WifiOff } from "lucide-react";
import { logger } from "@/lib/logger";

// Service Worker Registrierung Komponente
export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [contentCacheSize, setContentCacheSize] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const offlineToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect reduced-motion preference once on mount
  useEffect(() => {
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && mq.matches) setReduceMotion(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    setUpdateAvailable(false);
    window.location.reload();
  }, [registration]);

  useEffect(() => {
    // Online/Offline Status
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
      // Clear any pending toast hide timer
      if (offlineToastTimeoutRef.current) {
        clearTimeout(offlineToastTimeoutRef.current);
        offlineToastTimeoutRef.current = null;
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      // Toast nach 5 Sekunden ausblenden
      if (offlineToastTimeoutRef.current) {
        clearTimeout(offlineToastTimeoutRef.current);
      }
      offlineToastTimeoutRef.current = setTimeout(() => setShowOfflineToast(false), 5000);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Service Worker wird von OneSignal verwaltet - keine manuelle Registrierung nötig
    // OneSignal registriert OneSignalSDKWorker.js automatisch mit allen Cache-Optimierungen

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (offlineToastTimeoutRef.current) {
        clearTimeout(offlineToastTimeoutRef.current);
        offlineToastTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Log content cache size changes for debugging
    // content cache size updated
  }, [contentCacheSize]);

  return (
    <>
      {/* Update Banner */}
      {updateAvailable && (
        <div aria-live="polite" role="status" className={`fixed top-0 left-0 right-0 z-[100] ${!reduceMotion ? 'animate-slide-down' : ''} safe-area-top`}>
          <div className="bg-primary text-primary-foreground px-4 py-3 shadow-lg">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin-slow" />
                <div>
                  <p className="font-medium text-sm">Neue Version verfügbar</p>
                  <p className="text-xs opacity-80">Jetzt aktualisieren für neue Features</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUpdateAvailable(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Später"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-3 py-1.5 bg-white text-primary text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
                >
                  Aktualisieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Toast */}
      {showOfflineToast && (
        <div aria-live="polite" role="status" className={`fixed top-4 left-4 right-4 z-[100] ${!reduceMotion ? 'animate-slide-down' : ''} safe-area-top`}>
          <div className="max-w-sm mx-auto bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <WifiOff className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">Offline Modus</p>
              <p className="text-xs opacity-80">Einige Funktionen sind eingeschränkt</p>
            </div>
            <button
              onClick={() => setShowOfflineToast(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Online Status Indicator (nur kurz anzeigen wenn wieder online) */}
      {isOnline && !showOfflineToast && (
        <OnlineIndicator />
      )}
    </>
  );
}

// Zeigt kurz an wenn wieder online
function OnlineIndicator() {
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && mq.matches) setReduceMotion(true);
    } catch (e) {
      // ignore
    }

    const handleOffline = () => setWasOffline(true);
    const handleOnline = () => {
      // read latest value via setter pattern to avoid stale closure
      setWasOffline(prev => {
        if (prev) {
          setShow(true);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = window.setTimeout(() => setShow(false), 3000) as unknown as number;
          return false;
        }
        return prev;
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!show) return null;

  return (
    <div aria-live="polite" role="status" className={`fixed top-4 left-4 right-4 z-[100] ${!reduceMotion ? 'animate-slide-down' : ''} safe-area-top`}>
      <div className="max-w-sm mx-auto bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <Wifi className="w-5 h-5" />
        <p className="font-medium text-sm">Wieder online</p>
      </div>
    </div>
  );
}

// Hook für PWA Features
// `usePWA` moved to `src/deprecated/components/service-worker.deprecated.tsx` and removed.
