"use client";

import React, { useState } from "react";

export default function MessageActions({ messageId }: { messageId: number }) {
  const [assignTo, setAssignTo] = useState<string>("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
      <div className="flex items-center gap-2">
        <input value={assignTo} onChange={(e) => setAssignTo(e.target.value)} placeholder="Zuweisen an Member-ID (optional)" className="input" />
        <button onClick={() => post(`/api/admin/messages/${messageId}/assign`, { assigneeId: assignTo ? Number(assignTo) : null })} disabled={loading} className="btn">Zuweisen</button>
      </div>

      <div>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Antwort schreiben (intern)" className="w-full p-2 border rounded" rows={4} />
        <div className="flex gap-2 mt-2">
          <button onClick={() => { if (!reply) return setMsg('Bitte Nachricht eingeben'); post(`/api/admin/messages/${messageId}/reply`, { body: reply }).then(() => setReply('')); }} disabled={loading} className="btn">Antwort senden</button>
          <button onClick={() => post(`/api/admin/messages/${messageId}/resolve`, {})} disabled={loading} className="btn-ghost">Als erledigt markieren</button>
          <button onClick={() => { if (!confirm('Wirklich löschen?')) return; post(`/api/admin/messages/${messageId}/delete`, {}).then(() => { /* optionally redirect */ }); }} disabled={loading} className="btn-danger">Löschen</button>
        </div>
      </div>

      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
    </div>
  );
}
