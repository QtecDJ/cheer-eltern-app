/**
 * GET /api/mail/conversation/[id]
 * Get full conversation thread
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptText } from "@/lib/crypto";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const threadId = parseInt(id);
    
    if (isNaN(threadId)) {
      return NextResponse.json(
        { error: "Ungültige Thread-ID" },
        { status: 400 }
      );
    }

    // Get message with all replies
    const message = await prisma.message.findUnique({
      where: { id: threadId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
    
    if (!message) {
      return NextResponse.json(
        { error: "Nachricht nicht gefunden" },
        { status: 404 }
      );
    }

    // Verify user has access to this message (sender or assignee)
    if (message.senderId !== user.id && message.assignedTo !== user.id) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diese Nachricht" },
        { status: 403 }
      );
    }

    // Decrypt message bodies
    const conversation = {
      ...message,
      body: message.body ? decryptText(message.body) : message.body,
      replies: message.replies.map(reply => ({
        ...reply,
        body: reply.body ? decryptText(reply.body) : reply.body,
      })),
    };

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Konversation" },
      { status: 500 }
    );
  }
}
