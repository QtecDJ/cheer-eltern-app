import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrainingContent } from "./training-content";

// Revalidate every 120 seconds
export const revalidate = 120;

async function getTrainings(teamId: number) {
  const trainings = await prisma.trainingSession.findMany({
    where: {
      teamId,
      isArchived: false,
    },
    orderBy: { date: "asc" },
    take: 20,
    include: {
      team: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  return trainings;
}

async function getAttendanceByTraining(memberId: number) {
  const attendances = await prisma.attendance.findMany({
    where: {
      memberId,
      type: "training",
    },
    orderBy: { date: "desc" },
    take: 50,
    select: {
      id: true,
      trainingId: true,
      status: true,
      date: true,
    },
  });

  return attendances;
}

export default async function TrainingPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const member = await prisma.member.findUnique({
    where: {
      id: session.id,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  if (!member || !member.teamId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Mitglied nicht gefunden</h1>
        </div>
      </div>
    );
  }

  const [trainings, attendances] = await Promise.all([
    getTrainings(member.teamId),
    getAttendanceByTraining(member.id),
  ]);

  // Erstelle eine Map für schnellen Zugriff auf Anwesenheit
  const attendanceMap = new Map(
    attendances.map((a) => [a.trainingId, a.status])
  );

  return (
    <TrainingContent
      member={member}
      trainings={trainings}
      attendanceMap={Object.fromEntries(attendanceMap)}
    />
  );
}
