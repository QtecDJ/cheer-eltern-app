import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/notifications/mark-read
 * Markiere Benachrichtigungen als gelesen
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Alle Benachrichtigungen des Users als gelesen markieren
      await db.notification.updateMany({
        where: {
          memberId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return NextResponse.json({ success: true, message: "Alle als gelesen markiert" });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds ist erforderlich" },
        { status: 400 }
      );
    }

    // Spezifische Benachrichtigungen als gelesen markieren
    await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        memberId: session.user.id // Sicherheit: Nur eigene Benachrichtigungen
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error marking notifications as read:', error);
    return NextResponse.json(
      { error: "Fehler beim Markieren" },
      { status: 500 }
    );
  }
}
