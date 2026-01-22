"use client";

import { useEffect, useState, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Offline Status Banner
 * Zeigt einen Banner wenn die App offline ist
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const offlineTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine);

    // Detect reduced-motion preference
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && mq.matches) setReduceMotion(true);
    } catch (e) {
      // ignore
    }

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
      // Nach 3 Sekunden Banner ausblenden
      if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);
      offlineTimeoutRef.current = window.setTimeout(() => setWasOffline(false), 3000) as unknown as number;
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
      }
    };
  }, []);

  // Zeige "Wieder online" kurz an
  if (wasOffline && isOnline) {
    return (
      <div aria-live="polite" role="status" className={`fixed top-0 left-0 right-0 z-50 bg-emerald-500 text-white px-4 py-2 text-center text-sm font-medium ${!reduceMotion ? 'animate-slide-down' : ''} shadow-lg`}>
        <div className="flex items-center justify-center gap-2">
          <Wifi className="w-4 h-4" />
          <span>Wieder online</span>
        </div>
      </div>
    );
  }

  // Zeige "Offline" Banner
  if (!isOnline) {
    return (
      <div aria-live="polite" role="status" className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Offline - Gecachte Inhalte werden angezeigt</span>
        </div>
      </div>
    );
  }

  return null;
}
