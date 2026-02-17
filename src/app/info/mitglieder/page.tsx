import { getMembersWithEmergencyInfo, getActiveTeamsForFilter, getMemberForHome } from "@/lib/queries";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InfoContent } from "../mitglieder-info-content";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function MitgliederInfoPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Prüfe ob User berechtigt ist (Admin, Trainer, Coach, Coach-Team oder zusätzliche Rollen wie 'orga')
  const userRole = session.userRole;
  const coachTeamId = session.coachTeamId;

  // Leite Rollen her (unterstützt neues `roles` array oder altes CSV `userRole`)
  const roles = session.roles && session.roles.length > 0
    ? session.roles.map(r => r.toLowerCase())
    : (userRole || "").toString().split(",").map(r => r.trim().toLowerCase()).filter(Boolean);

  // Berechtigung wenn Admin/Trainer/Coach, oder Coach-Team gesetzt, oder der User eine zusätzliche Rolle ausser 'member' besitzt (z.B. 'orga')
  const privileged = roles.includes("admin") || roles.includes("trainer") || roles.includes("coach");
  const hasExtraRole = roles.some(r => r && r !== "member");
  const hasPermission = privileged || !!coachTeamId || hasExtraRole;
  
  if (!hasPermission) {
    redirect("/");
  }

  const isAdmin = userRole === "admin";
  
  // For parent accounts, get the child's team instead of parent's teamId
  const activeProfileId = await getActiveProfileWithParentMapping(session);
  const member = await getMemberForHome(activeProfileId);
  const trainerTeamId = coachTeamId || member?.teamId || session.teamId;

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
