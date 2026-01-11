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
    select: { userRole: true, teamId: true },
  });

  if (!member || !isAdminOrTrainer(member.userRole)) {
    redirect("/");
  }

  const isAdmin = member.userRole === "admin";
  const trainerTeamId = member.teamId;

  // Hole das nächste/aktuelle Training
  // Für Trainer: nur ihr Team, für Admins: alle
  const today = new Date().toISOString().split('T')[0];
  
  const currentTraining = await prisma.trainingSession.findFirst({
    where: {
      status: { not: "cancelled" },
      date: { gte: today },
      isArchived: false,
      ...(isAdmin ? {} : { teamId: trainerTeamId }),
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

  if (!currentTraining) {
    // Kein Training gefunden
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Anwesenheit</h1>
        <p className="text-muted-foreground">Kein aktuelles Training gefunden.</p>
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

  return (
    <AnwesenheitContent
      training={currentTraining}
      members={members}
      existingAttendances={attendances}
      isAdmin={isAdmin}
    />
  );
}
