import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTrainingPlanById } from "@/lib/queries";

export default async function TrainingPlanDetailPage(props: any) {
  // `params` can be an unresolved Promise in Next.js — await it when present
  let params: any = {};
  if (props && props.params) {
    // props.params may be a Promise that resolves to the params object
    // await it to safely access `id` without runtime errors
    // fallback to the raw value if await fails
    try {
      params = await props.params;
    } catch (e) {
      params = props.params || {};
    }
  }
  const session = await getSession();
  if (!session) redirect('/login');
  const roles = (session.roles || []).map((r:any) => (r||'').toString().toLowerCase());
  if (!roles.includes('coach') && !roles.includes('admin')) redirect('/');
  // params.id can be a string or an array (when Next.js routes provide segments)
  const rawId = params?.id;
  let id = 0;
  if (Array.isArray(rawId)) {
    id = Number(rawId[0]);
  } else if (rawId !== undefined && rawId !== null) {
    id = Number(rawId);
  }
  if (!id || Number.isNaN(id)) return <div className="py-6">Ungültige ID: {String(rawId)}</div>;
  const plan = await getTrainingPlanById(id);
  if (!plan) return <div className="py-6">Plan nicht gefunden</div>;

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto bg-card p-4 rounded">
        <h2 className="text-xl font-semibold">{plan.title}</h2>
        <div className="text-sm text-muted-foreground">{new Date(plan.date).toLocaleString()}</div>
        {plan.location && <div className="text-sm">Ort: {plan.location}</div>}
        {plan.description && <div className="mt-2">{plan.description}</div>}
        {plan.objectives && (
          <div className="mt-3">
            <strong>Ziele:</strong>
            {Array.isArray(plan.objectives) ? (
              <ul className="list-disc ml-5 mt-1">
                {plan.objectives.filter(Boolean).map((o: any, i: number) => (
                  <li key={i}>{String(o)}</li>
                ))}
              </ul>
            ) : (
              <div className="mt-1">{String(plan.objectives)}</div>
            )}
          </div>
        )}

        {plan.drills && (
          <div className="mt-3">
            <strong>Drills:</strong>
            {Array.isArray(plan.drills) ? (
              <ul className="list-disc ml-5 mt-1">
                {plan.drills
                  .filter((d: any) => d && (d.name || d.duration))
                  .map((d: any, i: number) => (
                    <li key={i}>
                      {d.name ? String(d.name) : 'Ohne Namen'}{d.duration ? ` — ${d.duration} min` : ''}
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="mt-1">{String(plan.drills)}</div>
            )}
          </div>
        )}

        {plan.materials && (
          <div className="mt-3">
            <strong>Material:</strong>
            {Array.isArray(plan.materials) ? (
              <ul className="list-disc ml-5 mt-1">
                {plan.materials.filter(Boolean).map((m: any, i: number) => (
                  <li key={i}>{String(m)}</li>
                ))}
              </ul>
            ) : (
              <div className="mt-1">{String(plan.materials)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

  // Client-side fallback when server `params` is not available for some routing setups.
  "use client";
  import React, { useEffect, useState } from 'react';

  function ClientTrainingPlanFallback() {
    const [plan, setPlan] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      // try extract id from pathname
      try {
        const parts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
        const idStr = parts[parts.length - 1];
        const id = Number(idStr);
        if (!id || Number.isNaN(id)) {
          setError('Ungültige ID');
          return;
        }
        fetch(`/api/coaches/training-plans/${id}`).then(async res => {
          if (!res.ok) throw new Error('Plan nicht gefunden');
          const j = await res.json();
          setPlan(j);
        }).catch(e => setError(e.message || 'Fehler'));
      } catch (e:any) {
        setError(String(e));
      }
    }, []);

    if (error) return <div className="py-6">{error}</div>;
    if (!plan) return <div className="py-6">Lade...</div>;

    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto bg-card p-4 rounded">
          <h2 className="text-xl font-semibold">{plan.title}</h2>
          <div className="text-sm text-muted-foreground">{new Date(plan.date).toLocaleString()}</div>
          {plan.team?.name && <div className="text-sm">Team: {plan.team.name}</div>}
          {plan.description && <div className="mt-2">{plan.description}</div>}
        </div>
      </div>
    );
  }

