"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CheckSquare } from "lucide-react";

export default function MessageItem({ message }: { message: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    
    const abortController = new AbortController();
    
    (async () => {
      try {
        const res = await fetch(`/api/messages/${message.id}/read`, { 
          method: "POST",
          signal: abortController.signal
        });
        if (res.ok && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('messages:changed', { detail: { localDecrementAssigned: true } }));
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // Ignore abort errors
        // ignore other errors; server will validate permissions
      }
    })();
    
    return () => {
      abortController.abort();
    };
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

  // Check if this is a todo assignment message
  const todoLinkMatch = message.body?.match(/\[Zur Aufgabe\]\((\/admin\/todos\/(\d+))\)/);
  const todoLink = todoLinkMatch ? todoLinkMatch[1] : null;
  const todoId = todoLinkMatch ? todoLinkMatch[2] : null;

  // Load current todo description if this is a todo message
  const [todoDescription, setTodoDescription] = useState<string | null>(null);
  const [fullMessageBody, setFullMessageBody] = useState<string>(message.body || '');
  
  useEffect(() => {
    if (!open || !todoId) return;
    
    const abortController = new AbortController();
    let mounted = true;
    
    (async () => {
      try {
        const res = await fetch(`/api/admin/todos/${todoId}`, {
          signal: abortController.signal
        });
        if (res.ok && mounted) {
          const data = await res.json();
          if (data.todo?.description) {
            setTodoDescription(data.todo.description);
            
            // Replace the description part in the message body
            const originalBody = message.body || '';
            const descriptionMatch = originalBody.match(/(.*?\*\*\n\n)([\s\S]*?)(\n\nPriorität.*)/);
            if (descriptionMatch) {
              const newBody = descriptionMatch[1] + data.todo.description + descriptionMatch[3];
              setFullMessageBody(newBody);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to load todo description:', err);
        }
      }
    })();
    
    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [open, todoId, message.body]);

  // Handle checkbox changes
  useEffect(() => {
    if (!open || !descriptionRef.current) return;

    const handleCheckboxChange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox' && todoId) {
        // Get the full HTML
        const fullHtml = descriptionRef.current?.innerHTML || '';
        
        console.log('💾 Saving checkbox state for todo', todoId);
        console.log('HTML:', fullHtml.substring(0, 200));
        
        // Update local state immediately
        setTodoDescription(fullHtml);
        
        // Also update the full message body with new description
        const originalBody = message.body || '';
        const descriptionMatch = originalBody.match(/(.*?\*\*\n\n)([\s\S]*?)(\n\nPriorität.*)/);
        if (descriptionMatch) {
          const newBody = descriptionMatch[1] + fullHtml + descriptionMatch[3];
          setFullMessageBody(newBody);
        }
        
        // Update todo description
        try {
          const res = await fetch(`/api/admin/todos/${todoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: fullHtml }),
          });
          const data = await res.json();
          console.log('✅ Saved:', data);
        } catch (err) {
          console.error('❌ Failed to save checkbox state:', err);
        }
      }
    };

    const checkboxes = descriptionRef.current?.querySelectorAll('input[type="checkbox"]');
    checkboxes?.forEach(cb => cb.addEventListener('change', handleCheckboxChange));

    return () => {
      checkboxes?.forEach(cb => cb.removeEventListener('change', handleCheckboxChange));
    };
  }, [open, todoId, todoDescription]);

  // Mark todo as done
  const [marking, setMarking] = useState(false);
  async function markAsDone() {
    if (!todoId) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/admin/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      if (res.ok) {
        alert('Aufgabe als erledigt markiert!');
      }
    } catch (err) {
      console.error('Failed to mark as done:', err);
    } finally {
      setMarking(false);
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
          <div className="font-medium flex items-center gap-2">
            {todoLink && <CheckSquare className="h-4 w-4 text-blue-500" />}
            {message.subject}
          </div>
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
          <div 
            ref={descriptionRef}
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: fullMessageBody }}
          />
          
          {todoId && (
            <div className="mt-3">
              <button 
                onClick={markAsDone}
                disabled={marking}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckSquare className="h-4 w-4" />
                {marking ? 'Wird markiert...' : 'Als erledigt markieren'}
              </button>
            </div>
          )}
          
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
