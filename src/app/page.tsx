
import { HomeContent } from "./home-content";
import { redirect } from "next/navigation";

export const revalidate = 90;

import { headers } from "next/headers";

export default async function HomePage() {
  const hdrs = await headers();
  const baseUrl = hdrs.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${protocol}://${baseUrl}/api/bootstrap`, { next: { revalidate: 90 } });
  if (!res.ok) {
    if (res.status === 401) {
      redirect("/login");
    }
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
