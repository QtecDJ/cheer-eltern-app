
import { HomeContent } from "./home-content";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";
import {
  getMemberForHome,
  getUpcomingTrainingsMinimal,
  getAttendanceStats,
  getAnnouncementsMinimal,
  getEventAnnouncementsWithPolls,
  getAllPollsWithVotes,
  getLatestAssessmentMinimal,
  getMessagesForStaff,
  getResolvedMessageCount,
} from "@/lib/queries";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is a parent (has parent role, regardless of other roles)
  // Check both roles array AND userRole field for comprehensive role detection
  const rolesFromArray = session.roles || [];
  const rolesFromString = session.userRole?.split(',').map(r => r.trim()) || [];
  const allRoles = [...new Set([...rolesFromArray, ...rolesFromString])]; // Combine and deduplicate
  
  const hasParentRole = allRoles.includes('parent');
  
  // getActiveProfileWithParentMapping() automatically returns child's ID for parent accounts
  const activeProfileId = await getActiveProfileWithParentMapping(session);
  let parentInfo = null;
  
  // If user has parent role, load parent info for display
  if (hasParentRole) {
    const parentMember = await prisma.member.findUnique({
      where: { id: session.id },
      select: { 
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
      },
    });
    
    if (parentMember) {
      parentInfo = {
        id: parentMember.id,
        name: parentMember.name,
        firstName: parentMember.firstName,
        lastName: parentMember.lastName,
        photoUrl: parentMember.photoUrl,
      };
    }
  }

  const child = await getMemberForHome(activeProfileId);

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Mitglied nicht gefunden</h1>
        </div>
      </div>
    );
  }

  const teamIds = Array.from(new Set([session.teamId, session.coachTeamId].filter(Boolean))) as number[];
  const relevantTeamIdOrArray = teamIds.length > 0 ? teamIds : undefined;

  const isOrga = (session.roles || []).includes("orga") || (session.userRole || "").toString().toLowerCase().split(',').includes('orga');

  const [upcomingTrainings, attendanceStats, announcements, latestAssessment] = await Promise.all([
    getUpcomingTrainingsMinimal(child.teamId!),
    getAttendanceStats(child.id),
    // Orga users should get announcements with poll data (to inspect votes)
    // Provide `undefined` team filter for orga so they see polls across teams
    isOrga ? (getEventAnnouncementsWithPolls as any)(undefined, activeProfileId) : getAnnouncementsMinimal(child.teamId ?? undefined),
    getLatestAssessmentMinimal(child.id),
  ]);

  // If orga, also fetch raw polls (team-independent) to surface them on the home dashboard
  let orgaPollsRaw: any[] = [];
  if (isOrga) {
    orgaPollsRaw = await getAllPollsWithVotes(100);
  }

  // If orga, fetch open messages and resolved counts for dashboard
  let openMessages: any[] = [];
  let resolvedMessageCount = 0;
  if (isOrga) {
    openMessages = await getMessagesForStaff(10);
    resolvedMessageCount = await getResolvedMessageCount();
  }

  // Normalize orga polls to the client-facing PollData shape expected by HomeContent
  const orgaPolls = orgaPollsRaw.map((p: any) => {
    const allVoterIds = (p.PollOption || []).flatMap((opt: any) => (opt.PollVote || []).map((v: any) => v.memberId));
    const uniqueVoters = new Set(allVoterIds);
    const totalVotes = uniqueVoters.size;

    const options = (p.PollOption || []).map((opt: any) => ({
      id: opt.id,
      text: opt.text,
      voteCount: (opt.PollVote || []).length,
      percentage: totalVotes > 0 ? ((opt.PollVote || []).length / totalVotes) * 100 : 0,
      isSelected: false,
      voters: (opt.PollVote || []).map((v: any) => ({
        id: v.Member?.id,
        firstName: v.Member?.firstName,
        lastName: v.Member?.lastName,
        photoUrl: v.Member?.photoUrl || null,
      })),
    }));

    return {
      id: p.id,
      question: p.question,
      allowMultiple: p.allowMultiple,
      isAnonymous: p.isAnonymous,
      endsAt: p.endsAt || null,
      totalVotes,
      hasVoted: false,
      options,
    };
  });

  return (
    <HomeContent
      child={child}
      upcomingTrainings={upcomingTrainings}
      attendanceStats={attendanceStats}
      latestAssessment={latestAssessment}
      announcements={announcements}
      showUpcoming={!isOrga}
      showVoterNames={isOrga}
      polls={orgaPolls}
      openMessages={openMessages}
      resolvedMessageCount={resolvedMessageCount}
      isOrga={isOrga}
      parentInfo={parentInfo}
    />
  );
}
