import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTrainingPlanById } from "@/lib/queries";

export default async function TrainingPlanDetailPage({ params }: any) {
  const session = await getSession();
  if (!session) redirect('/login');
  const roles = (session.roles || []).map((r:any) => (r||'').toString().toLowerCase());
  if (!roles.includes('coach') && !roles.includes('admin')) redirect('/');

  const id = Number((params && params.id) || 0);
  if (!id) return <div className="py-6">Ungültige ID</div>;
  const plan = await getTrainingPlanById(id);
  if (!plan) return <div className="py-6">Plan nicht gefunden</div>;

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto bg-card p-4 rounded">
        <h2 className="text-xl font-semibold">{plan.title}</h2>
        <div className="text-sm text-muted-foreground">{new Date(plan.date).toLocaleString()}</div>
        {plan.location && <div className="text-sm">Ort: {plan.location}</div>}
        {plan.description && <div className="mt-2">{plan.description}</div>}
        {plan.objectives && <div className="mt-3"><strong>Ziele:</strong><pre className="whitespace-pre-wrap">{JSON.stringify(plan.objectives, null, 2)}</pre></div>}
        {plan.drills && <div className="mt-3"><strong>Drills:</strong><pre className="whitespace-pre-wrap">{JSON.stringify(plan.drills, null, 2)}</pre></div>}
        {plan.materials && <div className="mt-3"><strong>Material:</strong><pre className="whitespace-pre-wrap">{JSON.stringify(plan.materials, null, 2)}</pre></div>}
      </div>
    </div>
  );
}
