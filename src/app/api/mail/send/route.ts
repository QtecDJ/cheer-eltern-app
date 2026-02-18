/**
 * POST /api/mail/send
 * Send new message (currently supports 1-to-1 messages only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptText } from "@/lib/crypto";
import { sendOneSignalPushByExternalUserId } from "@/lib/onesignal-push";
import { validateRequestSafe } from "@/lib/validation";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";

// Schema für Direct Messages
const DirectMessageSchema = z.object({
  recipientId: z.number().int().positive().or(z.string().transform(Number)),
  subject: z.string().max(255).optional(),
  message: z.string().min(1, "Nachricht darf nicht leer sein").max(10000),
});

export async function POST(request: NextRequest) {
  // Rate Limiting - WRITE preset
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.WRITE);
  if (rateLimitResult) return rateLimitResult;
  
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Input Validation mit Zod
    const validation = validateRequestSafe(DirectMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: validation.error },
        { status: 400 }
      );
    }

    const { recipientId, subject, message } = validation.data;

    // Create message with encrypted body
    const encryptedBody = encryptText(message);
    const newMessage = await prisma.message.create({
      data: {
        senderId: user.id,
        assignedTo: typeof recipientId === 'string' ? parseInt(recipientId) : recipientId,
        subject: subject || `Nachricht von ${user.firstName || user.name}`,
        body: encryptedBody,
        status: 'open',
      },
    });

    // Send push notification to recipient via OneSignal
    sendOneSignalPushByExternalUserId(`member_${recipientId}`, {
      title: `Neue Nachricht von ${user.firstName || user.name}`,
      body: message.substring(0, 100),
      url: `/messages/${newMessage.id}`,
      icon: '/icons/icon-192x192.png',
    }).catch(error => {
      console.error('Failed to send OneSignal push:', error);
    });

    return NextResponse.json({ 
      success: true,
      messageId: newMessage.id 
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Fehler beim Senden der Nachricht" },
      { status: 500 }
    );
  }
}
