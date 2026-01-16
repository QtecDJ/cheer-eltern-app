import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    if (existingAttendance) {
      // Update bestehenden Eintrag
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: prismaStatus,
          notes: status === "present" ? "Vom Trainer markiert" : "Vom Trainer als abwesend markiert",
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
          notes: status === "present" ? "Vom Trainer markiert" : "Vom Trainer als abwesend markiert",
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
