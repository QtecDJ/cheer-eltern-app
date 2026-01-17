import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeContent } from "./home-content";
import {
  getMemberForHome,
  getUpcomingTrainingsMinimal,
  getAttendanceStats,
  getAnnouncementsMinimal,
  getLatestAssessmentMinimal,
} from "@/lib/queries";

// Revalidate every 90 seconds - optimiert für weniger Function Invocations
// Service Worker cached zusätzlich 2-5 Min (iOS: 2.5 Min)
export const revalidate = 90;

export default async function HomePage() {
  const session = await getSession();
  
  // Nicht eingeloggt -> zur Login-Seite
  if (!session) {
    redirect("/login");
  }

  const child = await getMemberForHome(session.id);

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Mitglied nicht gefunden</h1>
          <p className="text-muted-foreground">
            Bitte kontaktiere den Trainer.
          </p>
        </div>
      </div>
    );
  }

  // Alle Daten parallel laden - optimiert mit minimalen Selects
  const [upcomingTrainings, attendanceStats, announcements, latestAssessment] = await Promise.all([
    getUpcomingTrainingsMinimal(child.teamId!),
    getAttendanceStats(child.id),
    getAnnouncementsMinimal(child.teamId ?? undefined),
    getLatestAssessmentMinimal(child.id),
  ]);

  return (
    <HomeContent
      child={child}
      upcomingTrainings={upcomingTrainings}
      attendanceStats={attendanceStats}
      latestAssessment={latestAssessment}
      announcements={announcements}
    />
  );
}
