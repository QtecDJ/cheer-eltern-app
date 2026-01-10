import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventsContent } from "./events-content";

async function getEvents() {
  const events = await prisma.event.findMany({
    where: {
      status: { in: ["upcoming", "completed"] },
    },
    orderBy: { date: "asc" },
    take: 20,
  });

  return events;
}

async function getCompetitions() {
  const competitions = await prisma.competition.findMany({
    where: {
      status: { in: ["upcoming", "completed"] },
    },
    orderBy: { date: "asc" },
    take: 20,
  });

  return competitions;
}

async function getEventAnnouncements(teamId?: number) {
  const now = new Date();
  
  const announcements = await prisma.announcement.findMany({
    where: {
      category: "event",
      AND: [
        {
          OR: [
            { teamId: null },
            { teamId: teamId },
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
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return announcements;
}

export default async function EventsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const [events, competitions, eventAnnouncements] = await Promise.all([
    getEvents(),
    getCompetitions(),
    getEventAnnouncements(session.teamId ?? undefined),
  ]);

  return (
    <EventsContent 
      events={events} 
      competitions={competitions} 
      eventAnnouncements={eventAnnouncements}
    />
  );
}
