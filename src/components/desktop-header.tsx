"use client";

import React from "react";
import { Settings } from "lucide-react";
import Link from "next/link";

interface DesktopHeaderProps {
  userName?: string;
  userRole?: string;
  hasNotifications?: boolean;
  isAdmin?: boolean;
}

export function DesktopHeader({ userName, userRole, hasNotifications, isAdmin }: DesktopHeaderProps) {
  return (
    <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-slate-900/50 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-40">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white font-bold text-xl">IC</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">ICA Members</h1>
          <p className="text-xs text-muted-foreground">Cheerleading Platform</p>
        </div>
      </div>

      {/* Admin Button */}
      {isAdmin && (
        <Link 
          href="/admin"
          className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-primary/20 transition-all"
          title="Admin Bereich"
        >
          <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
      )}
    </header>
  );
}
