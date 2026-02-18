/**
 * POST /api/mail/reply
 * Reply to an existing message
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptText } from "@/lib/crypto";
import { sendOneSignalPushByExternalUserId } from "@/lib/onesignal-push";
import { validateRequestSafe } from "@/lib/validation";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";

// Validation Schema
const MessageReplySchema = z.object({
  messageId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  message: z.string().min(1, "Nachricht darf nicht leer sein").max(10000),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
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
    const validation = validateRequestSafe(MessageReplySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: validation.error },
        { status: 400 }
      );
    }

    const { messageId, message } = validation.data;
    const parsedMessageId = typeof messageId === 'string' ? parseInt(messageId) : messageId;

    // Get root message to verify access
    const rootMessage = await prisma.message.findUnique({
      where: { id: parsedMessageId },
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
        messageId: parsedMessageId,
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
        url: `/messages/${parsedMessageId}`,
        icon: '/icons/icon-192x192.png',
      }).catch(error => {
        console.error('Failed to send OneSignal push:', error);
      });
    }

    return NextResponse.json({ 
      success: true,
      replyId: reply.id 
    });
  } catch (error: unknown) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: "Fehler beim Senden der Antwort" },
      { status: 500 }
    );
  }
}
