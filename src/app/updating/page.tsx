"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export default function UpdatingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simuliere Update-Prozess über 4 Sekunden
    const duration = 4000; // 4 Sekunden
    const steps = 100;
    const interval = duration / steps;

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timer);
        // Kurz warten bevor redirect
        setTimeout(() => {
          router.push("/");
        }, 300);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon/Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Update wird installiert
          </h1>
          <p className="text-gray-600">
            Bitte warten, während die neueste Version geladen wird...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-gray-500">{progress}%</p>
        </div>

        {/* Features/Info */}
        <div className="pt-4 text-left bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">
            Neu in dieser Version:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Verbesserte Team-Verwaltung
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Optimierte Anwesenheitsübersicht
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Performance-Verbesserungen
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
