import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json({ attendanceMap: map });
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

    const body = await request.json();
    const { trainingId, memberId, status } = body;

    if (!trainingId || !memberId) {
      return NextResponse.json(
        { error: "trainingId und memberId sind erforderlich" },
        { status: 400 }
      );
    }
    
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
