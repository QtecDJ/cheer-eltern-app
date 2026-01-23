import { 
  getNextTrainingForAttendance, 
  getTeamMembersForAttendance, 
  getAttendancesForTraining,
  getCoachTeamName,
  getActiveTeamsForFilter,
} from "@/lib/queries";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnwesenheitContent } from "./anwesenheit-content";

// Revalidate every 30 seconds for attendance
export const revalidate = 30;

export default async function AnwesenheitPage({ searchParams }: { searchParams?: any }) {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Prüfe ob User berechtigt ist (Admin, Trainer, Coach oder Athlete mit coachTeamId)
  const userRole = session.userRole;
  const coachTeamId = session.coachTeamId;
  
  // Berechtigung: Admin/Trainer ODER User hat coachTeamId (auch wenn nur Athlete)
  const hasPermission = isAdminOrTrainer(userRole) || !!coachTeamId;
  
  if (!hasPermission) {
    redirect("/");
  }

  const isAdmin = userRole === "admin";

  // Anwesenheit page - user context loaded

  // Wenn Coach und kein Team zugewiesen, zeige Fehlermeldung
  if (!isAdmin && !coachTeamId) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Anwesenheit</h1>
        <p className="text-muted-foreground">
          Du bist keinem Team zugewiesen. Bitte kontaktiere einen Administrator.
        </p>
      </div>
    );
  }
  
  // Bestimme das selektierte Team: für Admins kann `searchParams.teamId` gewählt werden
  let selectedTeamId: number | null = coachTeamId ?? null;
  // `searchParams` can be a Promise in some Next.js contexts — await it safely
  const params = await (searchParams ?? {});
  if (isAdmin) {
    const raw = params?.teamId;
    let teamIdStr: string | undefined;
    if (Array.isArray(raw)) {
      teamIdStr = raw[0];
    } else {
      teamIdStr = raw;
    }

    if (teamIdStr) {
      const parsed = Number(teamIdStr);
      selectedTeamId = Number.isFinite(parsed) ? parsed : null;
    } else {
      selectedTeamId = null;
    }
  }

  // Wenn Admin, lade verfügbare Teams zur Auswahl
  const activeTeams = isAdmin ? await getActiveTeamsForFilter() : null;

  const currentTraining = await getNextTrainingForAttendance(selectedTeamId ?? null);

  // current training loaded

  if (!currentTraining) {
    // Kein Training gefunden
    const coachTeam = coachTeamId 
      ? await getCoachTeamName(coachTeamId)
      : null;
    
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Anwesenheit</h1>
        <p className="text-muted-foreground mb-2">
          Kein aktuelles Training gefunden{coachTeam ? ` für Team ${coachTeam.name}` : ''}.
        </p>
        {!isAdmin && coachTeam && (
          <p className="text-sm text-muted-foreground">
            Du bist als Coach für Team <strong>{coachTeam.name}</strong> zugewiesen.
          </p>
        )}
      </div>
    );
  }

  // Safety check: teamId sollte nicht null sein wenn Training existiert
  if (!currentTraining.teamId) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Anwesenheit</h1>
        <p className="text-muted-foreground">
          Fehler: Training hat kein Team zugewiesen.
        </p>
      </div>
    );
  }

  // Hole alle aktiven Mitglieder des Teams
  const members = await getTeamMembersForAttendance(currentTraining.teamId);

  // Hole bestehende Attendance-Einträge für dieses Training
  const attendances = await getAttendancesForTraining(currentTraining.id);

  // Serialisiere serverseitige Date-Objekte zu ISO-Strings für Props
  const serializedAttendances = attendances.map((a) => ({
    ...a,
    updatedAt: a.updatedAt ? a.updatedAt.toISOString() : null,
  }));

  // Berechne Statistiken auf dem Server für Hydration-Konsistenz
  const excusedCount = attendances.filter(a => a.status === "excused").length;

  return (
    <AnwesenheitContent
      training={currentTraining}
      members={members}
      existingAttendances={serializedAttendances}
      initialExcusedCount={excusedCount}
      isAdmin={isAdmin}
      teams={activeTeams}
      selectedTeamId={selectedTeamId ?? null}
    />
  );
}
