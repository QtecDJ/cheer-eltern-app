"use client";

import React, { useState } from "react";
import { Send, Check, Trash2 } from "lucide-react";

export default function MessageActions({ messageId }: { messageId: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  

  const post = async (path: string, body: any) => {
    setLoading(true);
    try {
      const res = await fetch(path, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "error");
      setMsg("Erfolgreich ausgeführt");
      setTimeout(() => setMsg(null), 2500);
      return json;
    } catch (e: any) {
      setMsg(`Fehler: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Zuweisen-UI entfernt vorübergehend */}

      <div className="mt-3">
          <div className="flex flex-row gap-2 items-center">
            <button
              onClick={() => setReplyOpen(true)}
              disabled={loading}
              className="btn flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Antworten
            </button>

            <button
              onClick={() => post(`/api/admin/messages/${messageId}/resolve`, {})}
              disabled={loading}
              className="btn-ghost flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Als erledigt
            </button>

            <button
              onClick={() => setDeleteOpen(true)}
              disabled={loading}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          </div>
      </div>

        {replyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setReplyOpen(false); setReplyText(""); }} />
            <div className="relative w-full max-w-lg mx-4 bg-background border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Antworten</div>
                <button onClick={() => { setReplyOpen(false); setReplyText(""); }} className="text-sm text-muted-foreground">Schließen</button>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Antwort schreiben..."
                rows={5}
                className="w-full p-2 border rounded bg-transparent"
              />

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    if (!replyText.trim()) return setMsg("Bitte Nachricht eingeben");
                    post(`/api/admin/messages/${messageId}/reply`, { body: replyText.trim() }).then(() => {
                      setReplyOpen(false);
                      setReplyText("");
                    });
                  }}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-primary text-primary-foreground rounded"
                >
                  Antwort senden
                </button>
                <button onClick={() => { setReplyOpen(false); setReplyText(""); }} className="py-2 px-3 rounded border">Abbrechen</button>
              </div>
            </div>
          </div>
        )}

        {deleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteOpen(false)} />
            <div className="relative w-full max-w-md mx-4 bg-background border rounded p-4">
              <div className="font-medium mb-2">Nachricht löschen?</div>
              <div className="text-sm text-muted-foreground mb-4">Diese Aktion kann nicht rückgängig gemacht werden.</div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLoading(true);
                    post(`/api/admin/messages/${messageId}/delete`, {}).then(() => {
                      setLoading(false);
                      setDeleteOpen(false);
                    }).catch(() => setLoading(false));
                  }}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-destructive text-destructive-foreground rounded"
                >
                  Ja, löschen
                </button>
                <button onClick={() => setDeleteOpen(false)} className="py-2 px-3 rounded border">Nein</button>
              </div>
            </div>
          </div>
        )}

      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
    </div>
  );
}
