import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/notifications
 * Hole alle Benachrichtigungen für den aktuellen User
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: {
        memberId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Letzte 50 Benachrichtigungen
    });

    const unreadCount = await db.notification.count({
      where: {
        memberId: session.user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('[API] Error fetching notifications:', error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Benachrichtigungen" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Erstelle neue Benachrichtigung (für Admins/System)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    // TODO: Check admin permission
    const body = await request.json();
    const { memberIds, type, title, message, link, trainingSessionId } = body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "memberIds ist erforderlich" },
        { status: 400 }
      );
    }

    // Erstelle Benachrichtigungen für alle Member
    const notifications = await Promise.all(
      memberIds.map((memberId: number) =>
        db.notification.create({
          data: {
            memberId,
            type: type || 'info',
            title,
            message,
            link: link || null,
            trainingSessionId: trainingSessionId || null
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: notifications.length
    });
  } catch (error) {
    console.error('[API] Error creating notifications:', error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Benachrichtigungen" },
      { status: 500 }
    );
  }
}
