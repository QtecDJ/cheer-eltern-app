"use client";
import React, { useEffect, useState } from 'react';

export default function ClientTrainingPlanFallback() {
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
