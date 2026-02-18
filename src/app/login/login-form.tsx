"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { Loader2, User, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";
import { InstallPrompt } from "@/components/install-prompt";
import { useSeasonalTheme } from "@/lib/seasonal-theme";
import { SeasonalOverlay } from "@/components/seasonal-overlay";

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Anmelden...
        </>
      ) : (
        "Anmelden"
      )}
    </button>
  );
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const theme = useSeasonalTheme();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await loginAction(formData);
    if (result && !result.success) {
      setError(result.error || "Ein Fehler ist aufgetreten");
    }
  }

  return (
    <div className={`h-screen w-screen fixed inset-0 flex flex-col items-center justify-center px-4 bg-gradient-to-br ${theme.gradient} overflow-hidden`}>
      {/* Seasonal Overlay Effect - nur bei aktiven Themen */}
      {theme.isActive && theme.overlayEffect && (
        <SeasonalOverlay effect={theme.overlayEffect} />
      )}

      {/* Seasonal Background Pattern - nur bei aktiven Themen */}
      {theme.isActive && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 text-9xl animate-bounce">{theme.iconOverlay || theme.emoji}</div>
          <div className="absolute bottom-20 left-10 text-9xl animate-pulse">{theme.iconOverlay || theme.emoji}</div>
          <div className="absolute top-1/2 left-1/2 text-9xl opacity-30">{theme.emoji}</div>
        </div>
      )}

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-3">
          <div className={`relative w-32 h-32 ${theme.isActive ? 'animate-float' : ''}`}>
            <Image
              src="/logo.webp"
              alt="Logo"
              fill
              className={`object-contain ${theme.isActive ? 'drop-shadow-2xl' : ''}`}
              priority
            />
            {/* Seasonal Icon Overlay - nur bei aktiven Themen */}
            {theme.isActive && theme.emoji && (
              <div className="absolute -top-2 -right-2 text-3xl animate-bounce">
                {theme.emoji}
              </div>
            )}
          </div>
          <div className="text-center">
            {theme.isActive && (
              <p className={`${theme.isActive ? 'text-white/90' : 'text-muted-foreground'} text-sm font-medium ${theme.isActive ? 'text-shadow' : ''}`}>
                {theme.motivationalText}
              </p>
            )}
            <p className={`${theme.isActive ? 'text-white/70' : 'text-muted-foreground'} ${theme.isActive ? 'mt-2' : ''} text-xs`}>
              Melde dich mit Vor- und Nachnamen an
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form action={handleSubmit} className={`space-y-3 p-5 rounded-2xl ${theme.isActive ? 'bg-white/10 backdrop-blur-md shadow-2xl' : 'bg-card border border-border shadow-lg'}`}>
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                name="firstName"
                placeholder="Vorname"
                required
                autoComplete="given-name"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 text-foreground placeholder:text-muted-foreground text-sm ${
                  theme.isActive 
                    ? 'bg-white/95 backdrop-blur-sm border border-white/20 focus:ring-white/50 shadow-lg' 
                    : 'bg-card border border-border focus:ring-primary'
                }`}
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                name="lastName"
                placeholder="Nachname"
                required
                autoComplete="family-name"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 text-foreground placeholder:text-muted-foreground text-sm ${
                  theme.isActive 
                    ? 'bg-white/95 backdrop-blur-sm border border-white/20 focus:ring-white/50 shadow-lg' 
                    : 'bg-card border border-border focus:ring-primary'
                }`}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                name="password"
                placeholder="Passwort"
                required
                minLength={4}
                autoComplete="current-password"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 text-foreground placeholder:text-muted-foreground text-sm ${
                  theme.isActive 
                    ? 'bg-white/95 backdrop-blur-sm border border-white/20 focus:ring-white/50 shadow-lg' 
                    : 'bg-card border border-border focus:ring-primary'
                }`}
              />
            </div>
          </div>

          <SubmitButton />
        </form>
      </div>
      
      {/* PWA Install Prompt - Fixed at bottom */}
      <div className="absolute bottom-4 left-0 right-0 px-4 z-20">
        <InstallPrompt />
      </div>
    </div>
  );
}
