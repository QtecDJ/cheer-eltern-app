"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { Loader2, User, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";
import { InstallPrompt } from "@/components/install-prompt";

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
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

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await loginAction(formData);
    if (result && !result.success) {
      setError(result.error || "Ein Fehler ist aufgetreten");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-24 h-24">
            <Image
              src="/logo.webp"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">MEMBER</h1>
            <p className="text-muted-foreground mt-1">
              Melde dich mit Vor- und Nachnamen an
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="firstName"
                placeholder="Vorname"
                required
                autoComplete="given-name"
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="lastName"
                placeholder="Nachname"
                required
                autoComplete="family-name"
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                name="password"
                placeholder="Passwort"
                required
                minLength={4}
                autoComplete="current-password"
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <SubmitButton />
        </form>
      </div>
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
