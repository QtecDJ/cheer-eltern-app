"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";

export default function MessageItem({ message }: { message: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Card key={message.id} id={`msg-${message.id}`} className="p-4">
      <div className="flex justify-between items-start">
        <button
          onClick={() => setOpen((s) => !s)}
          className="text-left flex-1"
          aria-expanded={open}
        >
          <div className="font-medium">{message.subject}</div>
          <div className="text-xs text-muted-foreground">Erstellt: {new Date(message.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} — Status: {message.status}</div>
        </button>

        <div className="ml-3">
          {message.status === 'open' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Offen</span>}
          {message.status === 'assigned' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Zugewiesen</span>}
          {message.status === 'resolved' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Erledigt</span>}
        </div>
      </div>

      {open && (
        <div className="mt-3">
          <div className="whitespace-pre-wrap text-sm">{message.body}</div>

          {message.replies && message.replies.length > 0 && (
            <div className="mt-3 border-t pt-3 space-y-2">
              {message.replies.map((r: any) => (
                <div key={r.id} className="p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">{r.author?.firstName ? `${r.author.firstName} ${r.author.lastName}` : r.author?.name} — {new Date(r.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="mt-1 text-sm whitespace-pre-wrap">{r.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
