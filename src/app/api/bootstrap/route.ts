/**
 * Bootstrap API - Aggregierter Endpoint für Initial Load
 * 
 * [SAFE] [ADDITIVE]
 * - Neuer optionaler Endpoint
 * - Bestehende Endpoints bleiben unverändert
 * - Reduziert 4-5 separate API-Calls zu 1 Call beim App-Start
 * - Nutzung ist optional - alte Routes funktionieren weiter
 * 
 * ZIEL: ~75% weniger Function Invocations bei Initial Load
 * - Vorher: 4-5 API Calls (getMember, getTrainings, getStats, getAnnouncements, getAssessment)
 * - Nachher: 1 API Call (bootstrap mit allen Daten)
 * 
 * USAGE (optional, in Home-Content):
 * const bootstrap = await fetch('/api/bootstrap').then(r => r.json());
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getMemberForHome,
  getUpcomingTrainingsMinimal,
  getAttendanceStats,
  getAnnouncementsMinimal,
  getLatestAssessmentMinimal,
} from "@/lib/queries";

// Cache this endpoint aggressively
export const revalidate = 90; // 90 Sekunden

export async function GET(request: NextRequest) {
  try {
    // Early return: Nicht eingeloggt
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Nicht eingeloggt" },
        { status: 401 }
      );
    }

    // Member laden
    const child = await getMemberForHome(session.id);
    
    // Early return: Member nicht gefunden
    if (!child) {
      return NextResponse.json(
        { error: "Mitglied nicht gefunden" },
        { status: 404 }
      );
    }

    // Alle Daten parallel laden (optimiert mit minimalen Selects)
    const [upcomingTrainings, attendanceStats, announcements, latestAssessment] = 
      await Promise.all([
        getUpcomingTrainingsMinimal(child.teamId!),
        getAttendanceStats(child.id),
        getAnnouncementsMinimal(child.teamId ?? undefined),
        getLatestAssessmentMinimal(child.id),
      ]);

    // Aggregierte Response
    return NextResponse.json({
      child,
      upcomingTrainings,
      attendanceStats,
      announcements,
      latestAssessment,
      cachedAt: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'private, max-age=90, stale-while-revalidate=180',
        'X-Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("Bootstrap API error:", error);
    return NextResponse.json(
      { error: "Interner Fehler" },
      { status: 500 }
    );
  }
}
