"use client";

import { WifiOff, RefreshCw } from "lucide-react";

// Offline-Seite für PWA
export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-900">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-slate-400" />
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Keine Verbindung
          </h1>
          <p className="text-slate-400 max-w-xs mx-auto">
            Du bist offline. Bitte überprüfe deine Internetverbindung und versuche es erneut.
          </p>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={handleReload}
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Erneut versuchen
        </button>
        
        {/* Hint */}
        <p className="text-xs text-slate-500">
          Einige Funktionen sind offline verfügbar
        </p>
      </div>
    </div>
  );
}
