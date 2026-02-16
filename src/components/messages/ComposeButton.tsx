"use client";

import React, { useState } from "react";

export default function ComposeButton({ label = "Neue Nachricht", compact = false }: { label?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<string>("admins");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => {
    setOpen(false);
    setSubject("");
    setBody("");
    setError(null);
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) return setError("Bitte Betreff und Nachricht ausfüllen.");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: body.trim(), target }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Serverfehler");
      // show confirmation briefly then navigate to message anchor if available
        if (json?.message?.id) {
          setError(null);
          setSent(true);
          // keep modal open longer so the user clearly sees confirmation, then close and navigate
          setTimeout(() => {
            closeModal();
            window.location.href = `/messages#msg-${json.message.id}`;
          }, 2500);
          return;
        }
        // fallback: show sent confirmation then close
        setSent(true);
        setTimeout(() => {
          closeModal();
        }, 2500);
    } catch (e: unknown) {
      setError((e as Error)?.message || "Fehler beim Senden");
    } finally {
      setLoading(false);
    }
  };

  const triggerClass = compact
    ? "h-8 px-3 bg-primary text-primary-foreground rounded text-sm flex items-center leading-none"
    : "py-2 px-3 bg-primary text-primary-foreground rounded";

  return (
    <>
      <button onClick={openModal} className={triggerClass}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-lg mx-4 bg-background border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{label}</div>
              <button onClick={closeModal} className="text-sm text-muted-foreground">Schließen</button>
            </div>

              {sent && (
                <div role="status" aria-live="polite" className="mb-3 text-center text-base font-medium text-green-900 bg-green-100 border border-green-200 px-3 py-2 rounded shadow">
                  ✅ Nachricht eingegangen
                </div>
              )}

            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Betreff" className="w-full p-2 border rounded mb-2" disabled={sent || loading} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Nachricht" className="w-full p-2 border rounded" disabled={sent || loading} />

            <div className="mt-2">
              <label className="text-sm">Zielgruppe</label>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full p-1 border rounded bg-transparent mt-1" disabled={sent || loading}>
                <option value="admins">ICA Leitung</option>
                <option value="orga">Orga Team</option>
              </select>
            </div>

            {error && <div className="text-sm text-destructive mt-2">{error}</div>}

            <div className="flex gap-2 mt-3">
              <button onClick={send} disabled={loading || sent} className="ml-auto py-2 px-3 bg-primary text-primary-foreground rounded">{loading ? "Sende…" : sent ? "Gesendet" : "Senden"}</button>
              <button onClick={() => !sent && closeModal()} className={`py-2 px-3 rounded border ${sent ? 'opacity-50 pointer-events-none' : ''}`}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
