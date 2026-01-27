"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function TodoList({ todos, currentUserId, roles }: { todos: any[]; currentUserId: number; roles?: string[] }) {
  const [items, setItems] = useState<any[]>(todos || []);
  const isAdmin = (roles || []).map(r => (r||'').toString().toLowerCase()).includes('admin') || (roles || []).map(r => (r||'').toString().toLowerCase()).includes('orga');

  async function toggleDone(id: number, status: string) {
    try {
      const res = await fetch(`/api/admin/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ status }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (res.ok && json.todo) setItems((s) => s.map(it => it.id === id ? json.todo : it));
    } catch (e) { console.error(e); }
  }

  async function assignToMe(id: number) {
    try {
      const res = await fetch(`/api/admin/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ assigneeId: currentUserId }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (res.ok && json.todo) setItems((s) => s.map(it => it.id === id ? json.todo : it));
    } catch (e) { console.error(e); }
  }

  return (
    <div className="space-y-2 px-4 sm:px-0">
      {items.map(t => {
        const id = t?.id ?? null;
        return (
          <div key={id ?? `todo-${Math.random()}`} className="p-3 bg-card rounded border">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
                <div className="text-xs mt-1">Status: {t.status} — Priorität: {t.priority} {t.dueDate && <>— Fällig: {new Date(t.dueDate).toLocaleDateString()}</>}</div>
                <div className="text-xs text-muted-foreground">Erstellt von: {t.creator?.firstName ? `${t.creator.firstName} ${t.creator.lastName}` : t.creator?.name} {t.assignee ? `— Zugewiesen an ${t.assignee.firstName || t.assignee.name}` : ''}</div>
              </div>
              <div className="flex flex-col sm:flex-col gap-2 w-full sm:w-auto">
                {((t.creator?.id === currentUserId) || isAdmin) && t.status !== 'done' && <button className="w-full sm:w-auto py-2 px-2 bg-green-600 rounded text-sm text-white" onClick={() => id && toggleDone(id, 'done')}>Als erledigt markieren</button>}
                {/* assign removed per requirements */}
                {id ? (
                  <Link href={`/admin/todos/${id}`} className="w-full sm:w-auto py-2 px-2 bg-muted/30 rounded text-sm text-center">Öffnen</Link>
                ) : (
                  <button disabled className="w-full sm:w-auto py-2 px-2 bg-muted/10 rounded text-sm text-center text-muted-foreground">ID fehlt</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {items.length === 0 && <div className="text-sm text-muted-foreground">Keine Aufgaben.</div>}
    </div>
  );
}

