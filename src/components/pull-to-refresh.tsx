"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 80; // Mindestabstand zum Triggern
  const MAX_PULL = 120; // Maximale Pull-Distanz

  // Desktop Detection
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isDesktop) return; // Deaktiviert auf Desktop
    // Nur starten wenn am oberen Rand
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing, isDesktop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDesktop || !isPulling || isRefreshing) return; // Deaktiviert auf Desktop

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // Nur nach unten ziehen erlauben
    if (diff > 0) {
      // Easing für natürlicheres Gefühl
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);

      // Verhindere Scroll wenn Pull aktiv
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing, isDesktop]);

  const handleTouchEnd = useCallback(async () => {
    if (isDesktop || !isPulling) return; // Deaktiviert auf Desktop

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD); // Halte auf Threshold während Refresh

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Standard: Seite neu laden
          window.location.reload();
        }
      } catch (error) {
        console.error("[Pull-to-Refresh] Error:", error);
      }

      // Animation nach Refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 300);
    } else {
      setPullDistance(0);
    }

    setIsPulling(false);
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Touch Events
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Progress für visuelle Anzeige (0-1)
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isTriggered = pullDistance >= PULL_THRESHOLD;

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull-to-Refresh Indicator */}
      <div
        className="fixed left-0 right-0 flex items-center justify-center pointer-events-none z-50 transition-transform duration-200"
        style={{
          top: "env(safe-area-inset-top, 0px)",
          transform: `translateY(${Math.max(pullDistance - 60, -60)}px)`,
          opacity: progress,
        }}
      >
        <div
          className={`
            w-10 h-10 rounded-full bg-card border border-border shadow-lg
            flex items-center justify-center
            transition-all duration-200
            ${isTriggered ? "scale-110 bg-primary/10 border-primary" : ""}
          `}
        >
          <RefreshCw
            className={`
              w-5 h-5 transition-all duration-200
              ${isRefreshing ? "animate-spin text-primary" : ""}
              ${isTriggered && !isRefreshing ? "text-primary" : "text-muted-foreground"}
            `}
            style={{
              transform: isRefreshing ? "none" : `rotate(${progress * 180}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content mit Verschiebung beim Ziehen */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
