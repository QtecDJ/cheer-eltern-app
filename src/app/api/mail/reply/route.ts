/**
 * POST /api/mail/reply
 * Reply to an existing message
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptText } from "@/lib/crypto";
import { sendOneSignalPushByExternalUserId } from "@/lib/onesignal-push";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messageId, message } = body;

    // Validation
    if (!messageId || isNaN(parseInt(messageId))) {
      return NextResponse.json(
        { error: "Ungültige Nachrichten-ID" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Nachricht darf nicht leer sein" },
        { status: 400 }
      );
    }

    // Get root message to verify access
    const rootMessage = await prisma.message.findUnique({
      where: { id: parseInt(messageId) },
    });

    if (!rootMessage) {
      return NextResponse.json(
        { error: "Nachricht nicht gefunden" },
        { status: 404 }
      );
    }

    // Verify user is part of the conversation (sender or assignee)
    if (rootMessage.senderId !== user.id && rootMessage.assignedTo !== user.id) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diese Nachricht" },
        { status: 403 }
      );
    }

    // Create reply with encrypted body
    const encryptedBody = encryptText(message);
    const reply = await prisma.messageReply.create({
      data: {
        messageId: parseInt(messageId),
        authorId: user.id,
        body: encryptedBody,
      },
    });

    // Send push notification to the other party via OneSignal
    const recipientId = user.id === rootMessage.senderId ? rootMessage.assignedTo : rootMessage.senderId;
    if (recipientId) {
      sendOneSignalPushByExternalUserId(`member_${recipientId}`, {
        title: `${user.firstName || user.name} hat geantwortet`,
        body: message.substring(0, 100),
        url: `/messages/${messageId}`,
        icon: '/icons/icon-192x192.png',
      }).catch(error => {
        console.error('Failed to send OneSignal push:', error);
      });
    }

    return NextResponse.json({ 
      success: true,
      replyId: reply.id 
    });
  } catch (error: any) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: "Fehler beim Senden der Antwort" },
      { status: 500 }
    );
  }
}
