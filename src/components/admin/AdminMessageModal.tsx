"use client";

import React, { useState } from "react";
import AdminMessageComposer from "./AdminMessageComposer";
import { Plus } from "lucide-react";

export default function AdminMessageModal({ teams }: { teams: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-2 bg-primary text-primary-foreground rounded-lg shadow hover:bg-primary/90 transition-colors">
        <Plus className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-70 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-2xl mx-4 bg-background border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Nachricht an Mitglieder</div>
              <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground">Schließen</button>
            </div>
            <AdminMessageComposer teams={teams} />
            <div className="mt-3 text-right">
              <button onClick={() => setOpen(false)} className="py-2 px-3 rounded border">Schließen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
