"use client";
import React from "react";
import Link from "next/link";

export default function PlannerList({ plans, currentUserId }: { plans: any[]; currentUserId?: number }) {
  return (
    <div className="space-y-3">
      {plans && plans.length > 0 ? plans.map((p:any) => (
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
          </div>
        </div>
      )) : (<div className="text-sm text-muted-foreground">Keine Trainingspläne.</div>)}
    </div>
  );
}
