import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrainingContent } from "./training-content";

async function getTrainings(teamId: number) {
  const trainings = await prisma.trainingSession.findMany({
    where: {
      teamId,
      isArchived: false,
    },
    orderBy: { date: "desc" },
    take: 20,
    include: {
      team: true,
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
  });

  return attendances;
}

export default async function TrainingPage() {
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
    },
  });

  if (!child || !child.teamId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Kein Kind gefunden</h1>
        </div>
      </div>
    );
  }

  const [trainings, attendances] = await Promise.all([
    getTrainings(child.teamId),
    getAttendanceByTraining(child.id),
  ]);

  // Erstelle eine Map für schnellen Zugriff auf Anwesenheit
  const attendanceMap = new Map(
    attendances.map((a) => [a.trainingId, a.status])
  );

  return (
    <TrainingContent
      child={child}
      trainings={trainings}
      attendanceMap={Object.fromEntries(attendanceMap)}
    />
  );
}
