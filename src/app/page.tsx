
import { HomeContent } from "./home-content";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";

export const revalidate = 90;

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Host und Protokoll für absolute URL ermitteln
  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const apiUrl = `${protocol}://${host}/api/bootstrap`;

  const res = await fetch(apiUrl, { next: { revalidate: 90 } });
  if (!res.ok) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Fehler beim Laden</h1>
          <p className="text-muted-foreground">
            Bitte versuche es später erneut.
          </p>
        </div>
      </div>
    );
  }
  const {
    child,
    upcomingTrainings,
    attendanceStats,
    latestAssessment,
    announcements,
  } = await res.json();

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
