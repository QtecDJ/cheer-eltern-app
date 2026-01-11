import { prisma } from "@/lib/db";
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

  // Prüfe ob User berechtigt ist (Admin, Trainer, Coach)
  const member = await prisma.member.findUnique({
    where: { id: session.id },
    select: { userRole: true, teamId: true },
  });

  if (!member || !isAdminOrTrainer(member.userRole)) {
    redirect("/");
  }

  const isAdmin = member.userRole === "admin";
  const trainerTeamId = member.teamId;

  // Hole Mitglieder mit Notfall/Gesundheitsinfos
  // Admins sehen alle, Trainer nur ihr Team
  const members = await prisma.member.findMany({
    where: {
      status: "active",
      // Nur Mitglieder die mindestens eine Info haben
      OR: [
        { emergencyContact: { not: null } },
        { emergencyContact2: { not: null } },
        { allergies: { not: null } },
        { diseases: { not: null } },
        { medications: { not: null } },
      ],
      // Team-Filter für Trainer
      ...(isAdmin ? {} : { teamId: trainerTeamId }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      photoUrl: true,
      birthDate: true,
      emergencyContact: true,
      emergencyPhone: true,
      emergencyContact2: true,
      emergencyPhone2: true,
      allergies: true,
      diseases: true,
      medications: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: [
      { team: { name: "asc" } },
      { firstName: "asc" },
    ],
    take: 100, // Limit für Performance
  });

  // Hole alle Teams für Filter (nur für Admins)
  const teams = isAdmin 
    ? await prisma.team.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, color: true },
      })
    : [];

  return (
    <InfoContent
      members={members}
      teams={teams}
      isAdmin={isAdmin}
      currentUserTeamId={trainerTeamId}
    />
  );
}
