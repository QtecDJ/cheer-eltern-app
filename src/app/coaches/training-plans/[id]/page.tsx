import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTrainingPlanById } from "@/lib/queries";
import ClientTrainingPlanFallback from '@/components/coaches/ClientTrainingPlanFallback';

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
  if (!id || Number.isNaN(id)) return <ClientTrainingPlanFallback />;
  const plan = await getTrainingPlanById(id);
  if (!plan) return <div className="py-6">Plan nicht gefunden</div>;

  const isAdmin = roles.includes('admin');
  const canAccess = isAdmin || plan.creatorId === session.id || (plan.teamId && (session.coachTeamId === plan.teamId || session.teamId === plan.teamId));
  if (!canAccess) return <div className="py-6">Zugriff verweigert</div>;

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

