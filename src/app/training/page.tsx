import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrainingContent } from "./training-content";
import {
  getTrainingsList,
  getAttendanceMap,
  getMemberForHome,
} from "@/lib/queries";

// Revalidate every 180 seconds (3 Min) - Trainings sind relativ stabil
// Service Worker cached zusätzlich 2-5 Min
export const revalidate = 180;

export default async function TrainingPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const member = await getMemberForHome(session.id);

  if (!member || !member.teamId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Mitglied nicht gefunden</h1>
        </div>
      </div>
    );
  }

  // Trainer/Coach: Zeige Trainings für coachTeamId, sonst für teamId als Athlet
  // Nutzt bestehende optimierte Query ohne neue DB Calls
  const relevantTeamId = session.coachTeamId || member.teamId;

  // Alle Daten parallel laden mit optimierten Queries
  const [trainings, attendanceMap] = await Promise.all([
    getTrainingsList(relevantTeamId),
    getAttendanceMap(member.id),
  ]);

  return (
    <TrainingContent
      member={member}
      trainings={trainings}
      attendanceMap={attendanceMap}
    />
  );
}
