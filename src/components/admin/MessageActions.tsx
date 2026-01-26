"use client";

import React, { useState } from "react";
import { Send, Check, Trash2 } from "lucide-react";
import { UserPlus, RotateCw } from "lucide-react";

export default function MessageActions({ messageId, onReply }: { messageId: number; onReply?: (reply: any) => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [staff, setStaff] = useState<any[] | null>(null);
  

  const post = async (path: string, body: any) => {
    setLoading(true);
    try {
      const res = await fetch(path, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "error");
      setMsg("Erfolgreich ausgeführt");
      try {
        const urlParts = path.split('/');
        const idPart = urlParts.length ? urlParts[urlParts.length-2] : null;
        const mid = Number(idPart);
        if (!Number.isNaN(mid)) {
          // Notify others on the page to refresh this message
          if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('message:updated', { detail: { id: mid } }));
        }
      } catch (e) {
        // ignore
      }
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
            title="Antworten"
            aria-label="Antworten"
            onClick={() => setReplyOpen(true)}
            disabled={loading}
            className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>

          <button
            title="Zuweisen"
            aria-label="Zuweisen"
            onClick={async () => {
              setAssignOpen(true);
              // fetch staff list
              try {
                const res = await fetch('/api/admin/staff');
                if (res.ok) {
                  const j = await res.json();
                  setStaff(j.users || []);
                } else {
                  setStaff([]);
                }
              } catch (e) {
                setStaff([]);
              }
            }}
            disabled={loading}
            className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <button
            title="Als erledigt markieren"
            aria-label="Als erledigt markieren"
            onClick={() => post(`/api/admin/messages/${messageId}/resolve`, {})}
            disabled={loading}
            className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center"
          >
            <Check className="w-4 h-4" />
          </button>

          <button
            title="Wieder öffnen"
            aria-label="Wieder öffnen"
            onClick={() => post(`/api/admin/messages/${messageId}/assign`, { assigneeId: null })}
            disabled={loading}
            className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            title="Löschen"
            aria-label="Löschen"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
            className="w-8 h-8 rounded bg-destructive text-destructive-foreground flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
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
                    post(`/api/admin/messages/${messageId}/reply`, { body: replyText.trim() }).then((json) => {
                      setReplyOpen(false);
                      setReplyText("");
                      if (json?.reply && onReply) onReply(json.reply);
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

        {assignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setAssignOpen(false); setStaff(null); }} />
            <div className="relative w-full max-w-md mx-4 bg-background border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Zuweisen an</div>
                <button onClick={() => { setAssignOpen(false); setStaff(null); }} className="text-sm text-muted-foreground">Schließen</button>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto">
                {staff === null && <div className="text-sm text-muted-foreground">Lade...</div>}
                {staff && staff.length === 0 && <div className="text-sm text-muted-foreground">Keine verfügbaren Admin-/Orga-Nutzer gefunden.</div>}
                {staff && staff.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                    <div>{s.firstName ? `${s.firstName} ${s.lastName}` : s.name} <span className="text-xs text-muted-foreground">{(s.roles || s.userRole || []).toString()}</span></div>
                    <button
                      className="ml-2 px-3 py-1 bg-primary text-primary-foreground rounded"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await fetch(`/api/admin/messages/${messageId}/assign`, { method: 'POST', body: JSON.stringify({ assigneeId: s.id }), headers: { 'Content-Type': 'application/json' } });
                          if (res.ok) {
                            setAssignOpen(false);
                            setStaff(null);
                            // notify update
                            window.dispatchEvent(new CustomEvent('message:updated', { detail: { id: messageId } }));
                          } else {
                            const j = await res.json();
                            setMsg(`Fehler: ${j?.error || 'assign failed'}`);
                          }
                        } catch (e: any) {
                          setMsg(`Fehler: ${e.message || e}`);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Zuweisen
                    </button>
                  </div>
                ))}
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
