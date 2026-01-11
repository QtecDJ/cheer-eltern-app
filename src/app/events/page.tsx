import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventsContent } from "./events-content";
import { PollData } from "@/components/ui/poll";

async function getEvents() {
  const events = await prisma.event.findMany({
    where: {
      status: { in: ["upcoming", "completed"] },
    },
    include: {
      participants: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
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
    include: {
      participants: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
    orderBy: { date: "asc" },
    take: 20,
  });

  return competitions;
}

async function getEventAnnouncements(teamId?: number, memberId?: number) {
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
    include: {
      Poll: {
        include: {
          PollOption: {
            orderBy: { order: "asc" },
            include: {
              PollVote: {
                include: {
                  Member: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      photoUrl: true,
                    },
                  },
                },
              },
            },
          },
          PollVote: true,
        },
      },
      rsvps: {
        select: {
          id: true,
          memberId: true,
          status: true,
          respondedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Transformiere Announcements mit Poll-Daten
  return announcements.map((announcement) => {
    const poll = announcement.Poll[0]; // Eine Poll pro Announcement
    
    let pollData: PollData | null = null;
    
    if (poll && memberId) {
      // Berechne Gesamtstimmen (unique Mitglieder)
      const uniqueVoters = new Set(poll.PollVote.map((v) => v.memberId));
      const totalVotes = uniqueVoters.size;

      // Prüfe ob Mitglied bereits abgestimmt hat
      const hasVoted = poll.PollVote.some((v) => v.memberId === memberId);

      // Transformiere Optionen
      const options = poll.PollOption.map((option) => {
        const voteCount = option.PollVote.length;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        const isSelected = option.PollVote.some((v) => v.memberId === memberId);

        return {
          id: option.id,
          text: option.text,
          voteCount,
          percentage,
          isSelected,
          voters: poll.isAnonymous
            ? []
            : option.PollVote.map((v) => ({
                id: v.Member.id,
                firstName: v.Member.firstName,
                lastName: v.Member.lastName,
                photoUrl: v.Member.photoUrl,
              })),
        };
      });

      pollData = {
        id: poll.id,
        question: poll.question,
        allowMultiple: poll.allowMultiple,
        isAnonymous: poll.isAnonymous,
        endsAt: poll.endsAt,
        totalVotes,
        hasVoted,
        options,
      };
    }

    // RSVP-Daten berechnen
    const acceptedCount = announcement.rsvps.filter((r) => r.status === "accepted").length;
    const declinedCount = announcement.rsvps.filter((r) => r.status === "declined").length;
    const myRsvp = announcement.rsvps.find((r) => r.memberId === memberId);

    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      isPinned: announcement.isPinned,
      allowRsvp: announcement.allowRsvp,
      createdAt: announcement.createdAt,
      expiresAt: announcement.expiresAt,
      poll: pollData,
      rsvp: {
        acceptedCount,
        declinedCount,
        myStatus: myRsvp?.status ?? null,
      },
    };
  });
}

export default async function EventsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const [events, competitions, eventAnnouncements] = await Promise.all([
    getEvents(),
    getCompetitions(),
    getEventAnnouncements(session.teamId ?? undefined, session.id),
  ]);

  return (
    <EventsContent 
      events={events} 
      competitions={competitions} 
      eventAnnouncements={eventAnnouncements}
      memberId={session.id}
    />
  );
}
