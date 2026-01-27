"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

export default function MessageItem({ message }: { message: any }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // When opening a message, attempt to mark it as read/resolved for this user.
    (async () => {
      try {
        const res = await fetch(`/api/messages/${message.id}/read`, { method: "POST" });
        if (res.ok && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('messages:changed', { detail: { localDecrementAssigned: true } }));
        }
      } catch (e) {
        // ignore errors; server will validate permissions
      }
    })();
  }, [open, message.id]);

  // Replies local state so newly posted replies appear immediately
  const [replies, setReplies] = useState<any[]>(message.replies || []);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  async function postReply() {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/messages/${message.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'server_error');
      // append decrypted reply returned by server
      if (json?.reply) {
        const authorName = undefined; // author info not returned; UI will show generic
        setReplies((s) => [...s, { id: json.reply.id, body: json.reply.body, createdAt: json.reply.createdAt, author: { id: json.reply.authorId, name: authorName } }]);
      }
      setReplyText("");
      if (json?.reply && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('messages:changed', { detail: { localDecrementReplied: true } }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReplying(false);
    }
  }

  const hasReplies = (replies?.length || 0) > 0;
  // subtle left accent only when there are replies (orange)
  const highlightClass = hasReplies && message.status !== 'resolved' ? 'border-l-4 border-orange-400' : '';

  return (
    <Card key={message.id} id={`msg-${message.id}`} className={`p-4 ${highlightClass}`}> 
      <div className="flex justify-between items-start">
        <button
          onClick={() => setOpen((s) => !s)}
          className="text-left flex-1"
          aria-expanded={open}
        >
          <div className="font-medium">{message.subject}</div>
          <div className="text-xs text-muted-foreground">
            Erstellt: {new Date(message.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} — Status: {message.status}
            {message.assignee && (
              <> — Zu: {message.assignee.firstName ? `${message.assignee.firstName} ${message.assignee.lastName}` : message.assignee.name}</>
            )}
            {message.viewedAt && (
              <> — Gesehen: {new Date(message.viewedAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</>
            )}
          </div>
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
          {replies && replies.length > 0 && (
            <div className="mt-3 border-t pt-3 space-y-2">
              {replies.map((r: any) => (
                <div key={r.id} className="p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">{r.author?.firstName ? `${r.author.firstName} ${r.author.lastName}` : r.author?.name || 'Du'} — {new Date(r.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="mt-1 text-sm whitespace-pre-wrap">{r.body}</div>
                </div>
              ))}
            </div>
          )}

          {message.status !== 'resolved' && (
            <div className="mt-3 border-t pt-3">
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="Antwort schreiben..." className="w-full p-2 border rounded mb-2" />
              <div className="flex gap-2">
                <button onClick={postReply} disabled={replying || !replyText.trim()} className="ml-auto py-1 px-3 bg-primary text-primary-foreground rounded">{replying ? 'Sende…' : 'Antworten'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
