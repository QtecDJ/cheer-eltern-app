"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, X, Wifi, WifiOff } from "lucide-react";

// Service Worker Registrierung Komponente
export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [contentCacheSize, setContentCacheSize] = useState<number | null>(null);

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
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      // Toast nach 5 Sekunden ausblenden
      setTimeout(() => setShowOfflineToast(false), 5000);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Service Worker nur in Production oder wenn explizit aktiviert
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Warte bis die Seite geladen ist
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js", { 
            scope: "/",
            updateViaCache: "none", // Immer frischen SW laden
          });
          
          setRegistration(reg);

          // Query SW for content cache size (if controller present)
          const queryContentCacheSize = async () => {
            try {
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const mc = new MessageChannel();
                const promise = new Promise((resolve) => {
                  mc.port1.onmessage = (ev) => resolve(ev.data);
                  setTimeout(() => resolve({ success: false }), 1500);
                });

                navigator.serviceWorker.controller.postMessage({ type: 'GET_CONTENT_CACHE_SIZE' }, [mc.port2]);
                const res: any = await promise;
                if (res?.success) {
                  setContentCacheSize(res.size ?? 0);
                }
              }
            } catch (err) {
              console.warn('[PWA] Query content cache size failed', err);
            }
          };

          // Initial query
          queryContentCacheSize();

          // Update-Check alle 30 Minuten
          setInterval(() => {
            reg.update();
          }, 30 * 60 * 1000);

          // Update gefunden
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Prüfe ob bereits ein Update wartet
          if (reg.waiting) {
            setUpdateAvailable(true);
          }

        } catch (error) {
          console.error("[PWA] Service Worker Registrierung fehlgeschlagen:", error);
        }
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }

      // Controller-Wechsel behandeln
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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
        <div className="fixed top-0 left-0 right-0 z-[100] animate-slide-down safe-area-top">
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
        <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-down safe-area-top">
          <div className="max-w-sm mx-auto bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <WifiOff className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">Offline Modus</p>
              <p className="text-xs opacity-80">Einige Funktionen sind eingeschränkt</p>
            </div>
            <button
              onClick={() => setShowOfflineToast(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
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

  useEffect(() => {
    const handleOffline = () => setWasOffline(true);
    const handleOnline = () => {
      if (wasOffline) {
        setShow(true);
        setTimeout(() => setShow(false), 3000);
        setWasOffline(false);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [wasOffline]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-down safe-area-top">
      <div className="max-w-sm mx-auto bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <Wifi className="w-5 h-5" />
        <p className="font-medium text-sm">Wieder online</p>
      </div>
    </div>
  );
}

// Hook für PWA Features
// `usePWA` moved to `src/deprecated/components/service-worker.deprecated.tsx` and removed.
