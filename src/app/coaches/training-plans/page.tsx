import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTrainingPlansForCoach } from "@/lib/queries";
import PlannerList from "@/components/coaches/PlannerList";

export default async function TrainingPlansPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const roles = (session.roles || []).map((r:any) => (r||'').toString().toLowerCase());
  if (!roles.includes('coach') && !roles.includes('admin')) redirect('/');

  const plans = await getTrainingPlansForCoach(session.id, {}, 200);
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Trainingspläne</h1>
        <div>
          <a href="/coaches/training-plans/new" className="py-1 px-3 bg-primary rounded text-primary-foreground">Neuen Plan</a>
        </div>
      </div>
      <div>
        {/* @ts-ignore */}
        <PlannerList plans={plans} currentUserId={session.id} />
      </div>
    </div>
  );
}
