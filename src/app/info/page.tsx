import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InfoContent } from "./info-content";

// Revalidate every 600 seconds (10 Min) - Info-Inhalte ändern sich selten
export const revalidate = 600;

export default async function InfoPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Allow admins/trainers/coaches and users with extra roles (e.g. 'orga') to access the info overview,
  // but decide per-feature visibility (e.g. showAttendance) below.
  const roles = session.roles && session.roles.length > 0
    ? session.roles.map(r => r.toLowerCase())
    : (session.userRole || "").toString().split(",").map(r => r.trim().toLowerCase()).filter(Boolean);

  const isPrivileged = roles.includes("admin") || roles.includes("trainer") || roles.includes("coach");
  if (!isPrivileged && !roles.some(r => r && r !== "member")) {
    // no meaningful role - redirect to home
    redirect("/");
  }

  // show Attendance only to true privileged users (admin/trainer/coach) or if user has a coachTeamId
  const canSeeAttendance = isPrivileged || !!session.coachTeamId;

  return <InfoContent showAttendance={canSeeAttendance} />;
}
