import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EventsContent } from "./events-content";
import { PollData } from "@/components/ui/poll";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";
import {
  getEventsWithParticipants,
  getCompetitionsWithParticipants,
  getEventAnnouncementsWithPolls,
  getMemberForHome,
} from "@/lib/queries";

// ISR with 2-minute cache - Events need reasonable freshness
// SW provides additional 2-5 min client cache  
export const revalidate = 120;

// Transform Announcement data with Poll processing
function transformAnnouncements(announcements: any[], memberId: number) {
  return announcements.map((announcement) => {
    // Poll ist ein Array in der Prisma-Query, aber es gibt maximal 1 Poll pro Announcement
    const polls = announcement.Poll;
    const poll = polls && polls.length > 0 ? polls[0] : null;
    
    let pollData: PollData | null = null;
    
    if (poll && poll.PollOption) {
      // Berechne Gesamtstimmen (unique Mitglieder) aus den Votes der Options
      const allVoterIds = poll.PollOption.flatMap((opt: any) => 
        opt.PollVote?.map((v: any) => v.memberId) || []
      );
      const uniqueVoters = new Set(allVoterIds);
      const totalVotes = uniqueVoters.size;

      // Prüfe ob Mitglied bereits abgestimmt hat
      const hasVoted = poll.PollVote?.some((v: any) => v.memberId === memberId) || false;

      // Transformiere Optionen
      const options = poll.PollOption.map((option: any) => {
        const voteCount = option._count?.PollVote || 0;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        const isSelected = option.PollVote?.some((v: any) => v.memberId === memberId) || false;

        return {
          id: option.id,
          text: option.text,
          voteCount,
          percentage,
          isSelected,
          voters: poll.isAnonymous
            ? []
            : (option.PollVote?.map((v: any) => ({
                id: v.Member?.id,
                firstName: v.Member?.firstName,
                lastName: v.Member?.lastName,
                photoUrl: v.Member?.photoUrl,
              })) || []),
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
    const acceptedCount = announcement.rsvps.filter((r: any) => r.status === "accepted").length;
    const declinedCount = announcement.rsvps.filter((r: any) => r.status === "declined").length;
    const myRsvp = announcement.rsvps.find((r: any) => r.memberId === memberId);

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
      imageUrl: announcement.imageUrl,
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

  const activeProfileId = await getActiveProfileWithParentMapping(session);
  
  // Load member to get correct teamId (important for parent accounts)
  const member = await getMemberForHome(activeProfileId);
  
  if (!member) {
    redirect("/login");
  }

  // Use child's teamId for parent accounts, prefer athlete team but also include coach team
  const teamIds = Array.from(new Set([member.teamId, session.coachTeamId].filter(Boolean))) as number[];
  const relevantTeamIdOrArray = teamIds.length > 0 ? teamIds : undefined;

  // Alle Daten parallel laden mit optimierten Queries
  const [events, competitions, rawAnnouncements] = await Promise.all([
    getEventsWithParticipants(),
    getCompetitionsWithParticipants(),
    getEventAnnouncementsWithPolls(relevantTeamIdOrArray, activeProfileId),
  ]);

  // Transform announcements to match expected format
  const eventAnnouncements = transformAnnouncements(rawAnnouncements, activeProfileId);

  return (
    <EventsContent 
      events={events} 
      competitions={competitions} 
      eventAnnouncements={eventAnnouncements}
      memberId={activeProfileId}
      // Orga users should not see upcoming trainings and may see full poll voter names
      showUpcoming={!((session.roles || []).includes("orga") || (session.userRole || "").toString().toLowerCase().split(',').includes('orga'))}
      showVoterNames={(session.roles || []).includes("orga") || (session.userRole || "").toString().toLowerCase().split(',').includes('orga')}
    />
  );
}
