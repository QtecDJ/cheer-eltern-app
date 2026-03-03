import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrainingContent } from "./training-content";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";
import {
  getTrainingsList,
  getAttendanceMap,
  getMemberForHome,
} from "@/lib/queries";

// Kein ISR-Cache: Attendance-Daten sind personalisiert und müssen immer aktuell sein
export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const activeProfileId = await getActiveProfileWithParentMapping(session);
  const member = await getMemberForHome(activeProfileId);

  if (!member || !member.teamId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Mitglied nicht gefunden</h1>
        </div>
      </div>
    );
  }

  // Immer das eigene Team des Mitglieds verwenden (auch für Coaches)
  // coachTeamId ist das Team das sie coachen, NICHT das Team in dem sie selbst trainieren
  const relevantTeamId = member.teamId;

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
