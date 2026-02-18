import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMessageReply, getMessageById } from "@/lib/queries";
import { decryptText } from "@/lib/crypto";
import { sendOneSignalPushByExternalUserId } from "@/lib/onesignal-push";
import { revalidatePath } from "next/cache";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";
import { validateRequestSafe } from "@/lib/validation";

// Validation Schema
const ReplyBodySchema = z.object({
  body: z.string().min(1, "Antwort darf nicht leer sein").max(10000),
});

export async function POST(req: NextRequest, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  // Rate Limiting
  const rateLimitResult = await applyRateLimit(req, RateLimitPresets.WRITE);
  if (rateLimitResult) return rateLimitResult;
  
  try {
    const body = await req.json();
    
    // Input Validation mit Zod
    const validation = validateRequestSafe(ReplyBodySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: validation.error },
        { status: 400 }
      );
    }
    
    const messageId = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    
    // Validate ID
    if (isNaN(messageId) || messageId <= 0) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }
    
    const msg = await getMessageById(messageId);
    if (!msg) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // Only allow sender or assignee to reply
    if (msg.senderId !== session.id && msg.assignedTo !== session.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const created = await createMessageReply(messageId, session.id, validation.data.body);
    
    // Send OneSignal push notification to the other party
    const recipientId = session.id === msg.senderId ? msg.assignedTo : msg.senderId;
    if (recipientId) {
      sendOneSignalPushByExternalUserId(`member_${recipientId}`, {
        title: `Infinity Cheer Allstars`,
        body: `Neue Antwort: ${msg.subject}`,
        url: `/messages/${messageId}`,
        icon: '/icons/icon-192x192.png',
      }).catch(error => {
        console.error('Failed to send OneSignal push:', error);
      });
    }
    
    // decrypt body for immediate client use
    const replyBody = created.body ? decryptText(created.body) : created.body;
    
    // Invalidate messages cache for realtime feel
    revalidatePath("/messages");
    revalidatePath("/admin/messages");
    
    return NextResponse.json({ success: true, reply: { id: created.id, body: replyBody, createdAt: created.createdAt, authorId: created.authorId } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
