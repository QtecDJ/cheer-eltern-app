import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PlannerForm from "@/components/coaches/PlannerForm";
import { getTeamsMinimal } from "@/lib/queries";

export default async function NewTrainingPlanPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const roles = (session.roles || []).map((r:any) => (r||'').toString().toLowerCase());
  if (!roles.includes('coach') && !roles.includes('admin')) redirect('/');

  const teams = await getTeamsMinimal();

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto">
        {/* @ts-ignore */}
        <PlannerForm currentUserId={session.id} teams={teams} />
      </div>
    </div>
  );
}
