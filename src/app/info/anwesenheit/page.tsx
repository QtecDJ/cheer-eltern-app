import { prisma } from "@/lib/db";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnwesenheitContent } from "./anwesenheit-content";

// Revalidate every 30 seconds for attendance
export const revalidate = 30;

export default async function AnwesenheitPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Prüfe ob User berechtigt ist (Admin, Trainer, Coach)
  const member = await prisma.member.findUnique({
    where: { id: session.id },
    select: { 
      userRole: true, 
      teamId: true,
      coachTeamId: true,
      name: true,
    },
  });

  if (!member || !isAdminOrTrainer(member.userRole)) {
    redirect("/");
  }

  const isAdmin = member.userRole === "admin";
  const coachTeamId = member.coachTeamId;

  console.log('Anwesenheit Debug:', {
    userId: session.id,
    userName: member.name,
    userRole: member.userRole,
    isAdmin,
    coachTeamId,
  });

  // Hole das nächste/aktuelle Training
  // Für Trainer: nur ihr Team, für Admins: alle Teams
  const today = new Date().toISOString().split('T')[0];
  
  // Wenn Coach und kein Team zugewiesen, zeige Fehlermeldung
  if (!isAdmin && !coachTeamId) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Anwesenheit</h1>
        <p className="text-muted-foreground">
          Du bist keinem Team zugewiesen. Bitte kontaktiere einen Administrator.
        </p>
      </div>
    );
  }
  
  const currentTraining = await prisma.trainingSession.findFirst({
    where: {
      status: { not: "cancelled" },
      date: { gte: today },
      isArchived: false,
      // Für Coaches/Admins mit coachTeamId: nur ihr Team
      // Admins ohne coachTeamId: alle Teams
      ...(coachTeamId ? { teamId: coachTeamId } : {}),
    },
    orderBy: [
      { date: "asc" },
      { time: "asc" },
    ],
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      location: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  console.log('Training gefunden:', {
    trainingId: currentTraining?.id,
    trainingTitle: currentTraining?.title,
    trainingTeamId: currentTraining?.teamId,
    trainingTeamName: currentTraining?.team?.name,
    matchesCoachTeam: currentTraining?.teamId === coachTeamId,
  });

  if (!currentTraining) {
    // Kein Training gefunden
    const coachTeam = coachTeamId 
      ? await prisma.team.findUnique({
          where: { id: coachTeamId },
          select: { name: true },
        })
      : null;
    
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Anwesenheit</h1>
        <p className="text-muted-foreground mb-2">
          Kein aktuelles Training gefunden{coachTeam ? ` für Team ${coachTeam.name}` : ''}.
        </p>
        {!isAdmin && coachTeam && (
          <p className="text-sm text-muted-foreground">
            Du bist als Coach für Team <strong>{coachTeam.name}</strong> zugewiesen.
          </p>
        )}
      </div>
    );
  }

  // Hole alle aktiven Mitglieder des Teams
  const members = await prisma.member.findMany({
    where: {
      status: "active",
      teamId: currentTraining.teamId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      photoUrl: true,
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
      { firstName: "asc" },
    ],
    take: 50, // Limit für Performance
  });

  // Hole bestehende Attendance-Einträge für dieses Training
  const attendances = await prisma.attendance.findMany({
    where: {
      trainingId: currentTraining.id,
      type: "training",
    },
    select: {
      memberId: true,
      status: true,
      reason: true,
      notes: true,
    },
  });

  // Berechne Statistiken auf dem Server für Hydration-Konsistenz
  const excusedCount = attendances.filter(a => a.status === "excused").length;

  return (
    <AnwesenheitContent
      training={currentTraining}
      members={members}
      existingAttendances={attendances}
      initialExcusedCount={excusedCount}
      isAdmin={isAdmin}
    />
  );
}
