import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeContent } from "./home-content";

// Kind-Daten basierend auf Session laden
async function getChildData(memberId: number) {
  const child = await prisma.member.findUnique({
    where: {
      id: memberId,
    },
    include: {
      team: true,
      attendances: {
        orderBy: { date: "desc" },
        take: 20,
      },
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return child;
}

// Assessments separat laden (andere Tabelle)
async function getLatestAssessment(memberId: number) {
  const assessment = await prisma.trainingAssessment.findFirst({
    where: { memberId },
    orderBy: { date: "desc" },
  });
  return assessment;
}

async function getUpcomingTrainings(teamId: number) {
  const today = new Date().toISOString().split("T")[0];

  const trainings = await prisma.trainingSession.findMany({
    where: {
      teamId,
      isArchived: false,
      date: {
        gte: today,
      },
    },
    orderBy: { date: "asc" },
    take: 5,
    include: {
      team: true,
    },
  });

  return trainings;
}

async function getAttendanceStats(memberId: number) {
  const attendances = await prisma.attendance.findMany({
    where: { memberId },
  });

  const total = attendances.length;
  const present = attendances.filter((a) => a.status === "present").length;
  const absent = attendances.filter((a) => a.status === "absent").length;
  const excused = attendances.filter((a) => a.status === "excused").length;

  return { total, present, absent, excused };
}

async function getAnnouncements(teamId?: number) {
  const now = new Date();
  
  const announcements = await prisma.announcement.findMany({
    where: {
      AND: [
        {
          OR: [
            { teamId: null }, // Allgemeine Ankündigungen
            { teamId: teamId }, // Team-spezifische Ankündigungen
          ],
        },
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } },
          ],
        },
      ],
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 5,
  });

  return announcements;
}

export default async function HomePage() {
  const session = await getSession();
  
  // Nicht eingeloggt -> zur Login-Seite
  if (!session) {
    redirect("/login");
  }

  const child = await getChildData(session.childId);

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Kein Kind gefunden</h1>
          <p className="text-muted-foreground">
            Bitte kontaktiere den Trainer, um dein Kind hinzuzufügen.
          </p>
        </div>
      </div>
    );
  }

  const [upcomingTrainings, attendanceStats, announcements, latestAssessment] = await Promise.all([
    getUpcomingTrainings(child.teamId!),
    getAttendanceStats(child.id),
    getAnnouncements(child.teamId ?? undefined),
    getLatestAssessment(child.id),
  ]);

  return (
    <HomeContent
      child={child}
      upcomingTrainings={upcomingTrainings}
      attendanceStats={attendanceStats}
      latestAssessment={latestAssessment}
      unreadNotifications={child.notifications.length}
      announcements={announcements}
    />
  );
}
