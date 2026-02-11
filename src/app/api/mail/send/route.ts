/**
 * POST /api/mail/send
 * Send new message (currently supports 1-to-1 messages only)
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
    const { recipientId, subject, message } = body;

    // Validation
    if (!recipientId) {
      return NextResponse.json(
        { error: "Empfänger erforderlich" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Nachricht darf nicht leer sein" },
        { status: 400 }
      );
    }

    // Create message with encrypted body
    const encryptedBody = encryptText(message);
    const newMessage = await prisma.message.create({
      data: {
        senderId: user.id,
        assignedTo: parseInt(recipientId),
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
