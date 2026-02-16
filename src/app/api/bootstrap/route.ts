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
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";
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

    const activeProfileId = await getActiveProfileWithParentMapping(session);

    // Member laden
    const child = await getMemberForHome(activeProfileId);
    
    // Early return: Member nicht gefunden
    if (!child) {
      return NextResponse.json(
        { error: "Mitglied nicht gefunden" },
        { status: 404 }
      );
    }

    // Alle Daten parallel laden (robust gegen Teilfehler)
    const loaders = {
      upcomingTrainings: getUpcomingTrainingsMinimal(child.teamId!),
      attendanceStats: getAttendanceStats(child.id),
      announcements: getAnnouncementsMinimal(child.teamId ?? undefined),
      latestAssessment: getLatestAssessmentMinimal(child.id),
    } as const;

    const settled = await Promise.allSettled(Object.values(loaders));

    // Default fallbacks
    let upcomingTrainings: any = [];
    let attendanceStats: any = { total: 0, present: 0, absent: 0, excused: 0 };
    let announcements: any = [];
    let latestAssessment: any = null;

    // Map settled results back to keys in the same order
    const keys = Object.keys(loaders) as Array<keyof typeof loaders>;
    for (let i = 0; i < settled.length; i++) {
      const res = settled[i];
      const key = keys[i];
      if (res.status === 'fulfilled') {
        try {
          switch (key) {
            case 'upcomingTrainings': upcomingTrainings = res.value; break;
            case 'attendanceStats': attendanceStats = res.value; break;
            case 'announcements': announcements = res.value; break;
            case 'latestAssessment': latestAssessment = res.value; break;
          }
        } catch (err) {
          console.warn(`[bootstrap] Failed to assign ${key}:`, err);
        }
      } else {
        console.warn(`[bootstrap] Loader ${key} failed:`, res.reason);
      }
    }

    // Aggregierte Response
    // Build optional content version map (server-controlled versioning)
    const contentVersions: Record<string, string> = {};

    // Announcements: announcement-<id>
    if (Array.isArray(announcements)) {
      for (const a of announcements) {
        if (a?.id) {
          const v = a.updatedAt ? new Date(a.updatedAt).toISOString() : (a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString());
          contentVersions[`announcement-${a.id}`] = v;
        }
      }
    }

    // Trainings: event-<id>-description
    if (Array.isArray(upcomingTrainings)) {
      for (const t of upcomingTrainings) {
        if (t?.id) {
          const v = t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString();
          contentVersions[`event-${t.id}-description`] = v;
        }
      }
    }

    return NextResponse.json({
      child,
      upcomingTrainings,
      attendanceStats,
      announcements,
      latestAssessment,
      cachedAt: new Date().toISOString(),
      contentVersions,
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
