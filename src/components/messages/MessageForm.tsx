"use client";

import React, { useState } from "react";

export default function MessageForm() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<string>("admins");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!subject.trim() || !body.trim()) return setError("Bitte Betreff und Nachricht ausfüllen.");
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: body.trim(), target: target }),
      });
      if (!res.ok) throw new Error("Serverfehler");
      const json = await res.json();
      setStatus("sent");
      setSubject("");
      setBody("");
      // If we get the created message back, navigate to its anchor so the member sees it in the list
      if (json?.message?.id) {
        window.location.href = `/messages#msg-${json.message.id}`;
        return;
      }
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Fehler beim Senden");
    }
  };

  if (status === "sent") {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <div className="font-medium">Nachricht eingegangen – wir kümmern uns darum.</div>
        <div className="text-sm text-muted-foreground mt-1">Danke für deine Nachricht. Du findest sie in deiner Nachrichtenliste.</div>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="space-y-2">
      <label className="text-sm font-medium">Nachricht an das Team</label>
      <div className="flex gap-2 items-center">
        <label className="text-sm">Zielgruppe</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="p-1 border rounded bg-transparent">
          <option value="admins">ICA Leitung</option>
          <option value="orga">Orga Team</option>
        </select>
      </div>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Betreff (kurz)"
        maxLength={255}
        className="w-full p-2 border rounded bg-transparent"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Deine Nachricht..."
        rows={4}
        className="w-full p-2 border rounded bg-transparent"
      />

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex gap-2">
        <button type="submit" disabled={status === "sending"} className="flex-1 py-2 px-3 bg-primary text-primary-foreground rounded">
          {status === "sending" ? "Sende…" : "Nachricht senden"}
        </button>
        <button type="button" onClick={() => { setSubject(""); setBody(""); setError(null); }} className="py-2 px-3 rounded border">Zurücksetzen</button>
      </div>
    </form>
  );
}
