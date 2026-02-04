"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Mail, Info, Calendar, Bell, CheckSquare } from "lucide-react";

export default function AdminQuickButton() {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <div className="fixed right-[14px] bottom-[90px] z-[99999] lg:right-8 lg:bottom-8">
      <div className="flex flex-col items-end gap-2">
        {open && (
          <div className="mb-2 p-2 w-48 bg-card/90 backdrop-blur rounded-lg shadow-lg border border-border">
            <div className="space-y-2">
              <Link href="/admin/announcements" onClick={handleLinkClick} className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Ankündigungen</span>
              </Link>
              <Link href="/admin/messages" onClick={handleLinkClick} className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Nachrichten</span>
              </Link>
              <Link href="/admin/todos" onClick={handleLinkClick} className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded">
                <CheckSquare className="w-4 h-4" />
                <span className="text-sm">ToDo</span>
              </Link>
              <Link href="/coaches/training-plans" onClick={handleLinkClick} className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Trainingsplan</span>
              </Link>
              <Link href="/info/anwesenheit" onClick={handleLinkClick} className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Anwesenheit</span>
              </Link>
              <Link href="/info/mitglieder" onClick={handleLinkClick} className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded">
                <Info className="w-4 h-4" />
                <span className="text-sm">Mitglieder</span>
              </Link>
              {/* 'Admin' and 'Einstellungen' removed per request */}
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Admin Quick"
          title="Admin Menü"
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
