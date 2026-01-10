import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileContent } from "./profile-content";

export default async function ProfilePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const member = await prisma.member.findUnique({
    where: {
      id: session.id,
    },
    include: {
      team: true,
      attendances: true,
    },
  });

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Mitglied nicht gefunden</h1>
        </div>
      </div>
    );
  }

  // Lade neueste Bewertung separat
  const latestAssessment = await prisma.trainingAssessment.findFirst({
    where: { memberId: member.id },
    orderBy: { date: "desc" },
  });

  // Lade Team-Mitglieder (ohne das aktuelle Mitglied)
  const teamMembers = member.teamId
    ? await prisma.member.findMany({
        where: {
          teamId: member.teamId,
          status: "active",
          id: { not: member.id },
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
  const totalTrainings = member.attendances.length;
  const presentCount = member.attendances.filter((a) => a.status === "present").length;
  const attendanceRate =
    totalTrainings > 0 ? Math.round((presentCount / totalTrainings) * 100) : 0;

  return (
    <ProfileContent
      member={member}
      attendanceRate={attendanceRate}
      totalTrainings={totalTrainings}
      latestAssessment={latestAssessment}
      teamMembers={teamMembers}
    />
  );
}
