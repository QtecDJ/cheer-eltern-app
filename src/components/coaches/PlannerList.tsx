"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PlannerList({ plans, currentUserId, roles = [], coachTeamId = null }: { plans: any[]; currentUserId?: number; roles?: string[]; coachTeamId?: number | null }) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  async function handleDelete(id: number) {
    if (!confirm('Plan wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
    setLoadingIds((s) => [...s, id]);
    try {
      const res = await fetch(`/api/coaches/training-plans/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Fehler');
        alert(text || 'Fehler beim Löschen');
      } else {
        // refresh the server props
        router.refresh();
      }
    } catch (e:any) {
      alert(String(e.message || e));
    } finally {
      setLoadingIds((s) => s.filter(x => x !== id));
    }
  }

  const normalizedRoles = (roles || []).map((r:any) => (r||'').toString().toLowerCase());
  const isAdminGlobal = normalizedRoles.includes('admin');

  return (
    <div className="space-y-3">
      {plans && plans.length > 0 ? plans.map((p:any) => {
        const creatorId = p.creator?.id ?? p.creatorId;
        const canDelete = isAdminGlobal || creatorId === currentUserId || (coachTeamId && p.team?.id === coachTeamId);
        return (
          <div key={p.id} className="p-3 bg-card rounded border flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="font-medium">{p.title}</div>
                {p.team?.name && <div className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/10">{p.team.name}</div>}
              </div>
              <div className="text-xs text-muted-foreground">
                {p.startAt ? `${new Date(p.startAt).toLocaleDateString()} ${new Date(p.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : new Date(p.date).toLocaleDateString()}
                {p.endAt ? ` — ${new Date(p.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                {p.location ? ` — ${p.location}` : ''}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/coaches/training-plans/${p.id}`} className="py-1 px-3 bg-muted/30 rounded">Öffnen</Link>
              {canDelete && (
                <button onClick={() => handleDelete(p.id)} disabled={loadingIds.includes(p.id)} className="py-1 px-3 bg-red-600 text-white rounded">{loadingIds.includes(p.id) ? 'Lösche...' : 'Löschen'}</button>
              )}
            </div>
          </div>
        );
      }) : (<div className="text-sm text-muted-foreground">Keine Trainingspläne.</div>)}
    </div>
  );
}
