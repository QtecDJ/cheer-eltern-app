
import { HomeContent } from "./home-content";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getMemberForHome,
  getUpcomingTrainingsMinimal,
  getAttendanceStats,
  getAnnouncementsMinimal,
  getLatestAssessmentMinimal,
} from "@/lib/queries";

export const revalidate = 90;

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // session available

  const child = await getMemberForHome(session.id);

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Mitglied nicht gefunden</h1>
        </div>
      </div>
    );
  }

  const [upcomingTrainings, attendanceStats, announcements, latestAssessment] = await Promise.all([
    getUpcomingTrainingsMinimal(child.teamId!),
    getAttendanceStats(child.id),
    getAnnouncementsMinimal(child.teamId ?? undefined),
    getLatestAssessmentMinimal(child.id),
  ]);

  // Attendance map für schnelle Anzeige des RSVP-Status
  const attendanceMap = await (await import("@/lib/queries")).getAttendanceMap(child.id);
  // attendanceMap loaded

  return (
    <HomeContent
      child={child}
      upcomingTrainings={upcomingTrainings}
      attendanceStats={attendanceStats}
      latestAssessment={latestAssessment}
      announcements={announcements}
      attendanceMap={attendanceMap}
    />
  );
}
