"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Offline Status Banner
 * Zeigt einen Banner wenn die App offline ist
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
      // Nach 3 Sekunden Banner ausblenden
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Zeige "Wieder online" kurz an
  if (wasOffline && isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-500 text-white px-4 py-2 text-center text-sm font-medium animate-slide-down shadow-lg">
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Offline - Gecachte Inhalte werden angezeigt</span>
        </div>
      </div>
    );
  }

  return null;
}
