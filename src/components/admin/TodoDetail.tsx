"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function TodoDetail({ todo, currentUserId, roles }: { todo: any; currentUserId: number; roles?: string[] }) {
  const router = useRouter();
  const [item, setItem] = useState<any>(todo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveChanges(changes: any) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/todos/${item.id}`, { method: 'PATCH', body: JSON.stringify(changes), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Fehler');
      setItem(json.todo);
    } catch (e: any) {
      setError(e?.message || 'Fehler');
    } finally { setSaving(false); }
  }

  async function markDone() { await saveChanges({ status: 'done' }); }

  async function handleDelete() {
    if (!confirm('Aufgabe wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/admin/todos/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      router.push('/admin/todos');
    } catch (e) { console.error(e); alert('Löschen fehlgeschlagen'); }
  }
  const [comments, setComments] = useState<any[]>(item.comments || []);
  const isAdmin = (roles || []).map((r:any)=>(r||'').toString().toLowerCase()).includes('admin') || (roles || []).map((r:any)=>(r||'').toString().toLowerCase()).includes('orga');
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);

  async function postReply() {
    if (!reply.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/admin/todos/${item.id}/reply`, { method: 'POST', body: JSON.stringify({ body: reply.trim() }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Fehler');
      setComments((s) => [...s, { ...json.comment, author: { id: json.comment.authorId, firstName: (json.comment.author?.firstName || null), lastName: (json.comment.author?.lastName || null) } }]);
      setReply("");
    } catch (e) { console.error(e); alert('Fehler beim Posten'); }
    finally { setPosting(false); }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-4 sm:px-0">
      <div className="p-3 bg-card rounded border">
        <h2 className="text-xl font-semibold">{item.title}</h2>
        <div className="text-sm text-muted-foreground">{item.description}</div>
        <div className="text-xs mt-2">Status: {item.status} — Priorität: {item.priority} {item.dueDate && <>— Fällig: {new Date(item.dueDate).toLocaleDateString()}</>}</div>
        <div className="text-xs text-muted-foreground">Erstellt: {new Date(item.createdAt).toLocaleString()} von {item.creator?.firstName || item.creator?.name}</div>
        <div className="text-xs text-muted-foreground">Zugewiesen an: {item.assignee ? (item.assignee.firstName || item.assignee.name) : '—'}</div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-2">
        {((item.creator?.id === currentUserId) || isAdmin) && item.status !== 'done' && <button onClick={markDone} className="w-full sm:w-auto py-2 px-3 bg-green-600 rounded text-white">Als erledigt</button>}
        {/* assign removed per requirements */}
        {((item.creator?.id === currentUserId) || isAdmin) && <button onClick={handleDelete} className="w-full sm:w-auto py-2 px-3 bg-red-600 rounded text-white">Löschen</button>}
        <button onClick={() => router.push('/admin/todos')} className="w-full sm:w-auto py-2 px-3 bg-muted/30 rounded">Zurück</button>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-medium">Diskussion</h3>
        <div className="mt-2 space-y-2">
          {comments.length === 0 && <div className="text-sm text-muted-foreground">Keine Antworten.</div>}
          {comments.map((c, i) => (
            <div key={c.id ?? i} className="p-2 bg-card rounded">
              <div className="text-sm font-medium">{c.author?.firstName ? `${c.author.firstName} ${c.author.lastName || ''}` : c.author?.name || 'Mitglied'}</div>
              <div className="text-sm text-muted-foreground">{c.body}</div>
              <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Antwort schreiben..." className="w-full p-2 border rounded" rows={3} />
          <div className="flex gap-2 mt-2">
            <button onClick={postReply} disabled={posting} className="py-1 px-3 bg-primary text-white rounded">{posting ? 'Senden...' : 'Antworten'}</button>
            <button onClick={() => setReply('')} className="py-1 px-3 bg-muted/30 rounded">Abbrechen</button>
          </div>
        </div>
      </div>
    </div>
  );
}
