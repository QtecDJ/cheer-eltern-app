"use client";

import { useEffect } from "react";

// Service Worker Registrierung Komponente
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Service Worker nur in Production registrieren
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Warte bis die Seite geladen ist
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("[PWA] Service Worker registriert:", registration.scope);

            // Update-Check alle 60 Minuten
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);

            // Update gefunden
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // Neuer SW verfügbar - User informieren
                    if (window.confirm("Neue Version verfügbar! Jetzt aktualisieren?")) {
                      newWorker.postMessage({ type: "SKIP_WAITING" });
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("[PWA] Service Worker Registrierung fehlgeschlagen:", error);
          });

        // Controller-Wechsel behandeln
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      });
    }
  }, []);

  return null;
}

// Hook für PWA Install-Prompt
export function useInstallPrompt() {
  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Verhindere automatisches Prompt
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      
      // Custom Install-Button zeigen könnte hier implementiert werden
      console.log("[PWA] Install prompt available");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);
}

// TypeScript Interface für BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}
