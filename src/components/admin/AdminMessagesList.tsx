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
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedId(expandedId === m.id ? null : m.id); }}
            >
              <div className="font-medium">{m.subject}</div>
              <div className="text-xs text-muted-foreground">Von: {m.sender?.firstName ? `${m.sender.firstName} ${m.sender.lastName}` : m.sender?.name} — {new Date(m.createdAt).toLocaleString('de-DE')}</div>
            </div>
            {/* Inline action buttons removed — actions are available when message is expanded */}
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
