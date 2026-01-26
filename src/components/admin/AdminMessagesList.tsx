"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import MessageActions from "./MessageActions";

export default function AdminMessagesList({ messages }: { messages: any[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>(messages || []);
  useEffect(() => {
    function handler(e: any) {
      const id = e?.detail?.id;
      if (!id) return;
      // fetch updated message and replace in list
      fetch(`/api/admin/messages/${id}`).then(r => r.json()).then(j => {
        if (j?.success && j.message) {
          setItems(s => s.map(it => it.id === id ? j.message : it));
        }
      }).catch(err => console.error(err));
    }
    window.addEventListener('message:updated', handler as any);
    return () => window.removeEventListener('message:updated', handler as any);
  }, []);
  const [quickReplyId, setQuickReplyId] = useState<number | null>(null);
  const [quickReplyText, setQuickReplyText] = useState<string>("");

  return (
    <div className="space-y-2">
      {items.map((m) => (
        <Card key={m.id} className="p-3 relative">
          <div className="flex items-start">
            <div className="flex-1">
              <div className="font-medium">{m.subject}</div>
              <div className="text-xs text-muted-foreground">Von: {m.sender?.firstName ? `${m.sender.firstName} ${m.sender.lastName}` : m.sender?.name} — {new Date(m.createdAt).toLocaleString('de-DE')}</div>
            </div>
            <div className="ml-3 flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === m.id ? null : m.id); }} className="p-1 rounded hover:bg-muted text-sm">{expandedId === m.id ? 'Schließen' : 'Anzeigen'}</button>
              <button title="Antworten" aria-label="Antworten" onClick={(e) => { e.stopPropagation(); setQuickReplyId(m.id); setExpandedId(m.id); }} className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M3 6h11M3 14h7m13 2l-4-4m0 0l4-4m-4 4h-8" /></svg>
              </button>
              <button title="Mir zuweisen" aria-label="Mir zuweisen" onClick={async (e) => { e.stopPropagation(); try { const res = await fetch(`/api/admin/messages/${m.id}/assign-me`, { method: 'POST' }); if (res.ok) setItems(s => s.map(it => it.id === m.id ? { ...it, assignedTo: 'you' } : it)); } catch (e) { console.error(e); } }} className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a9 9 0 00-9 9h18a9 9 0 00-9-9z" /></svg>
              </button>
              <button title="Als erledigt" aria-label="Als erledigt" onClick={async (e) => { e.stopPropagation(); try { const res = await fetch(`/api/admin/messages/${m.id}/resolve`, { method: 'POST' }); if (res.ok) setItems(s => s.map(it => it.id === m.id ? { ...it, status: 'resolved' } : it)); } catch (e) { console.error(e); } }} className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
              <button title="Löschen" aria-label="Löschen" onClick={async (e) => { e.stopPropagation(); try { const res = await fetch(`/api/admin/messages/${m.id}/delete`, { method: 'POST' }); if (res.ok) setItems(s => s.filter(it => it.id !== m.id)); } catch (e) { console.error(e); } }} className="w-8 h-8 rounded bg-destructive text-destructive-foreground flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground flex items-center justify-between">
            <div>Status: {m.status}{m.assignedTo ? ` — Zugewiesen` : ''}</div>
            <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString('de-DE')}</div>
          </div>

          {expandedId === m.id && (
            <div className="mt-3">
              <div className="prose max-w-none text-sm mb-3">{m.body}</div>
              {m.replies && m.replies.length > 0 && (
                <div className="space-y-2 mb-3">
                  {m.replies.map((r: any) => (
                    <div key={r.id} className="p-2 bg-muted rounded text-sm">
                      <div className="text-xs text-muted-foreground">{r.author ? `${r.author.firstName || r.author.name || 'Autor'}` : (r.authorId ? `Von ${r.authorId}` : 'Admin')} — {new Date(r.createdAt).toLocaleString('de-DE')}</div>
                      <div>{r.body}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick reply (compact) */}
              {quickReplyId === m.id && (
                <div className="flex gap-2 mb-3">
                  <input value={quickReplyText} onChange={(e) => setQuickReplyText(e.target.value)} placeholder="Antwort schreiben..." className="flex-1 p-2 border rounded" />
                  <button className="py-2 px-3 bg-primary text-primary-foreground rounded" onClick={async () => {
                    if (!quickReplyText.trim()) return;
                    try {
                      const res = await fetch(`/api/admin/messages/${m.id}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: quickReplyText.trim() }) });
                      const json = await res.json();
                      if (res.ok && json?.reply) {
                        setItems(s => s.map(it => it.id === m.id ? { ...it, replies: [...(it.replies || []), json.reply] } : it));
                        setQuickReplyText('');
                        setQuickReplyId(null);
                      }
                    } catch (e) { console.error(e); }
                  }}>Senden</button>
                </div>
              )}

              {/* Inline admin actions + full modal reply */}
              {/* @ts-ignore */}
              <MessageActions messageId={m.id} onReply={(reply: any) => {
                setItems((s) => s.map(it => it.id === m.id ? { ...it, replies: [...(it.replies || []), reply] } : it));
              }} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
