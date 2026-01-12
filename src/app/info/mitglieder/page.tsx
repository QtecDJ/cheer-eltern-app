import { getMembersWithEmergencyInfo, getActiveTeamsForFilter } from "@/lib/queries";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InfoContent } from "../mitglieder-info-content";

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function MitgliederInfoPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Prüfe ob User berechtigt ist (Admin, Trainer, Coach oder Athlete mit coachTeamId)
  const userRole = session.userRole;
  const coachTeamId = session.coachTeamId;
  
  // Berechtigung: Admin/Trainer ODER User hat coachTeamId
  const hasPermission = isAdminOrTrainer(userRole) || !!coachTeamId;
  
  if (!hasPermission) {
    redirect("/");
  }

  const isAdmin = userRole === "admin";
  const trainerTeamId = coachTeamId || session.teamId;

  // Hole Mitglieder mit Notfall/Gesundheitsinfos
  // Admins sehen alle, Trainer/Coaches nur ihr Team
  const members = await getMembersWithEmergencyInfo(isAdmin, trainerTeamId);

  // Hole alle Teams für Filter (nur für Admins)
  const teams = isAdmin ? await getActiveTeamsForFilter() : [];

  return (
    <InfoContent
      members={members}
      teams={teams}
      isAdmin={isAdmin}
      currentUserTeamId={trainerTeamId}
    />
  );
}
