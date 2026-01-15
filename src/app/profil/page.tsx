import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileContent } from "./profile-content";
import {
  getMemberFullProfile,
  getTeamMembers,
  getAttendanceStats,
  getLatestAssessmentMinimal,
} from "@/lib/queries";

// Revalidate every 300 seconds (5 Min) - Profile ändern sich sehr selten
// Service Worker cached zusätzlich 5-10 Min (LONG strategy)
export const revalidate = 300;

export default async function ProfilePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

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
