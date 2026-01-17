"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

// TypeScript Interface für BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Erkennt ob Nutzer bereits die PWA installiert hat
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

// Erkennt iOS
function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

export function InstallPrompt() {
  // Initialer Zustand direkt berechnen (kein setState in useEffect)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false); // NEU: Kontrolliert Prompt-Anzeige
  const [showIOSPrompt, setShowIOSPrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    return isIOS() && !wasDismissed && !isStandalone();
  });
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("pwa-install-dismissed") === "true";
  });
  const [isInstalled, setIsInstalled] = useState(() => isStandalone());

  useEffect(() => {
    // Frühe Rückkehr wenn schon installiert
    if (isInstalled) {
      return;
    }

    // iOS: Verzögerung für iOS-Prompt
    if (isIOS() && showIOSPrompt) {
      const timer = setTimeout(() => {
        // iOS Prompt bleibt sichtbar nach Delay
      }, 30000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: beforeinstallprompt Event abfangen
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log("[PWA] Install prompt verfügbar - wird in 30s angezeigt");
      
      // NEU: Zeige Prompt erst nach 30 Sekunden
      setTimeout(() => {
        setShowPrompt(true);
        console.log("[PWA] Install prompt wird jetzt angezeigt");
      }, 30000);
    };

    // App wurde installiert
    const handleAppInstalled = () => {
      console.log("[PWA] App wurde installiert");
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled, showIOSPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Zeige den nativen Install-Dialog
    await deferredPrompt.prompt();

    // Warte auf User-Entscheidung
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] User choice:", outcome);

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSPrompt(false);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  // Nicht anzeigen wenn bereits installiert oder dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  // Android Install Banner - nur anzeigen wenn showPrompt true
  if (deferredPrompt && showPrompt) {
    return (
      <div className="fixed top-4 left-0 right-0 p-4 z-50 animate-slide-down">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xl max-w-sm mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">App installieren</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Füge die Member App zu deinem Home-Bildschirm hinzu
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 bg-muted text-muted-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
            >
              Später
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Installieren
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Install Anleitung
  if (showIOSPrompt) {
    return (
      <div className="fixed top-4 left-0 right-0 p-4 z-50 animate-slide-down">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xl max-w-sm mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">App installieren</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tippe auf{" "}
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 14V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </span>{" "}
                und dann <strong>&quot;Zum Home-Bildschirm&quot;</strong>
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
