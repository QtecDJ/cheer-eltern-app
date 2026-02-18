import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";
import { prisma } from "@/lib/db";
import { AttendanceCreateSchema, validateRequestSafe } from "@/lib/validation";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";

// Cache attendance data for 60 seconds

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting (READ preset)
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.READ);
    if (rateLimitResult) return rateLimitResult;

    const memberId = await getActiveProfileWithParentMapping(session);

    // Lade neueste Attendances (updatedAt) zuerst und nimm für jede trainingId den aktuellsten Eintrag
    const attendances = await prisma.attendance.findMany({
      where: { memberId, type: "training" },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { trainingId: true, status: true },
    });

    const map: Record<number, string> = {};
    for (const att of attendances) {
      if (att.trainingId && map[att.trainingId] === undefined) {
        map[att.trainingId] = att.status;
      }
    }

    const response = NextResponse.json({ attendanceMap: map });
    // Cache for 60 seconds, stale-while-revalidate for 120
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error) {
    console.error("Error fetching attendance map:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Rate Limiting
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.WRITE);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();

    // Input Validation mit Zod
    const validation = validateRequestSafe(AttendanceCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: validation.error },
        { status: 400 }
      );
    }

    const { trainingId, memberId, status } = validation.data;
    
    const activeProfileId = await getActiveProfileWithParentMapping(session);
    
    // Authorization: User kann nur eigene Attendance ändern, außer er ist Trainer/Admin
    const isOwnAttendance = Number(memberId) === activeProfileId;
    const sessionRoles = session.roles || (session.userRole ? [session.userRole] : []);
    const roles = Array.isArray(sessionRoles) 
      ? sessionRoles.flat().filter((r): r is string => typeof r === 'string').map(r => r.toLowerCase())
      : [];
    const isTrainerOrAdmin = roles.some(r => r === 'admin' || r === 'trainer' || r === 'orga');
    
    if (!isOwnAttendance && !isTrainerOrAdmin) {
      return NextResponse.json(
        { error: "Nicht berechtigt" },
        { status: 403 }
      );
    }

    // Prüfe ob Attendance bereits existiert
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        trainingId,
        memberId,
      },
    });

    if (status === null) {
      // Wenn status null ist, lösche den Eintrag
      if (existingAttendance) {
        await prisma.attendance.delete({
          where: { id: existingAttendance.id },
        });
      }
      return NextResponse.json({ success: true, deleted: true });
    }

    // Map status zu Prisma-Status
    const prismaStatus = status === "present" ? "present" : "absent";
    const notes = isTrainerOrAdmin 
      ? (status === "present" ? "Vom Trainer markiert" : "Vom Trainer als abwesend markiert")
      : (status === "present" ? "Zugesagt" : "Abgesagt");

    if (existingAttendance) {
      // Update bestehenden Eintrag
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: prismaStatus,
          notes,
          updatedAt: new Date(),
        },
      });
    } else {
      // Erstelle neuen Eintrag
      await prisma.attendance.create({
        data: {
          trainingId,
          memberId,
          status: prismaStatus,
          type: "training",
          notes,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Speichern der Anwesenheit:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
