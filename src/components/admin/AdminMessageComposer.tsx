"use client";

import React, { useState } from "react";

interface Team { id: number; name: string; members: { id: number; firstName?: string; lastName?: string; name?: string }[] }

export default function AdminMessageComposer({ teams }: { teams: Team[] }) {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(teams?.[0]?.id ?? null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [error, setError] = useState<string | null>(null);

  const membersForTeam = teams.find(t => t.id === selectedTeam)?.members || [];

  function toggleMember(id: number) {
    setSelectedMembers((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!subject.trim() || !body.trim() || selectedMembers.length === 0) return setError("Bitte Betreff, Nachricht und mindestens ein Mitglied auswählen.");
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch(`/api/admin/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim(), assignees: selectedMembers }),
      });
      if (!res.ok) throw new Error("Serverfehler");
      setStatus("sent");
      setSubject(""); setBody(""); setSelectedMembers([]);
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Fehler beim Senden");
    }
  }

  if (status === "sent") {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded text-black">
        Nachricht gesendet.
      </div>
    );
  }

  return (
    <form onSubmit={send} className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm">Mannschaft</label>
        <select value={selectedTeam ?? ""} onChange={(e) => setSelectedTeam(Number(e.target.value))} className="p-1 border rounded bg-transparent text-sm">
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium">Mitglieder</div>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto p-1">
          {membersForTeam.map(m => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selectedMembers.includes(m.id)} onChange={() => toggleMember(m.id)} />
              <span>{m.firstName ? `${m.firstName} ${m.lastName}` : m.name}</span>
            </label>
          ))}
          {membersForTeam.length === 0 && <div className="text-sm text-muted-foreground">Keine Mitglieder in dieser Mannschaft.</div>}
        </div>
      </div>

      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Betreff" className="w-full p-2 border rounded bg-transparent" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Nachricht" className="w-full p-2 border rounded bg-transparent" />

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex gap-2">
        <button type="submit" disabled={status === "sending"} className="py-2 px-3 bg-primary text-primary-foreground rounded">{status === "sending" ? "Sende…" : "An Mitglieder senden"}</button>
        <button type="button" onClick={() => { setSubject(""); setBody(""); setSelectedMembers([]); setError(null); }} className="py-2 px-3 rounded border">Zurücksetzen</button>
      </div>
    </form>
  );
}
