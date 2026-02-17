import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileContent } from "./profile-content";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";
import {
  getMemberFullProfile,
  getTeamMembers,
  getAttendanceStats,
  getLatestAssessmentMinimal,
} from "@/lib/queries";

// ISR with 10-minute cache - Profile data is nearly static
// SW provides additional 5-10 min client cache
export const revalidate = 600;

export default async function ProfilePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Use session.id to show logged-in user's own profile (not child's)
  const member = await getMemberFullProfile(session.id);

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Mitglied nicht gefunden</h1>
        </div>
      </div>
    );
  }

  // Alle Daten parallel laden mit optimierten Queries
  const [attendanceStats, latestAssessment, teamMembers] = await Promise.all([
    getAttendanceStats(member.id),
    getLatestAssessmentMinimal(member.id),
    member.team?.id ? getTeamMembers(member.team.id) : Promise.resolve([]),
  ]);

  // Berechne Attendance Rate
  const attendanceRate =
    attendanceStats.total > 0 
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100) 
      : 0;

  return (
    <ProfileContent
      member={member}
      attendanceRate={attendanceRate}
      totalTrainings={attendanceStats.total}
      latestAssessment={latestAssessment}
      teamMembers={teamMembers}
    />
  );
}
