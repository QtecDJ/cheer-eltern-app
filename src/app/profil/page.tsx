import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileContent } from "./profile-content";

export default async function ProfilePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const child = await prisma.member.findUnique({
    where: {
      id: session.childId,
    },
    include: {
      team: true,
      attendances: true,
    },
  });

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Kein Kind gefunden</h1>
        </div>
      </div>
    );
  }

  // Lade neueste Bewertung separat
  const latestAssessment = await prisma.trainingAssessment.findFirst({
    where: { memberId: child.id },
    orderBy: { date: "desc" },
  });

  // Lade Team-Mitglieder (ohne das aktuelle Kind)
  const teamMembers = child.teamId
    ? await prisma.member.findMany({
        where: {
          teamId: child.teamId,
          status: "active",
          id: { not: child.id },
        },
        orderBy: { firstName: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          role: true,
          photoUrl: true,
        },
      })
    : [];

  // Berechne Statistiken
  const totalTrainings = child.attendances.length;
  const presentCount = child.attendances.filter((a) => a.status === "present").length;
  const attendanceRate =
    totalTrainings > 0 ? Math.round((presentCount / totalTrainings) * 100) : 0;

  return (
    <ProfileContent
      child={child}
      attendanceRate={attendanceRate}
      totalTrainings={totalTrainings}
      latestAssessment={latestAssessment}
      teamMembers={teamMembers}
    />
  );
}
