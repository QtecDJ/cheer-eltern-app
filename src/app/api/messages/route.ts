import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMessage } from "@/lib/queries";
import { sendOneSignalPushToMultipleUsers } from "@/lib/onesignal-push";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { MessageCreateSchema, validateRequestSafe } from "@/lib/validation";
import { applyRateLimit, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Rate Limiting
  const rateLimitResult = await applyRateLimit(req, RateLimitPresets.WRITE);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();
    
    // Input Validation mit Zod
    const validation = validateRequestSafe(MessageCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: validation.error },
        { status: 400 }
      );
    }

    const { subject, message, target } = validation.data;
    const finalTarget = target || "admins";

    const created = await createMessage({ 
      subject, 
      body: message, 
      senderId: session.id, 
      target: finalTarget 
    });
    
    // Send push notification based on target audience
    const pushPayload = {
      title: `Infinity Cheer Allstars`,
      body: `Neue Nachricht: ${subject}`,
      url: `/messages/${created.id}`,
      icon: '/icons/icon-192x192.png',
    };
    
    // Get all members with the target roles and send individual notifications
    let targetRoles: string[] = [];
    if (finalTarget === "admins") {
      targetRoles = ["admin"];
    } else if (finalTarget === "orga") {
      targetRoles = ["admin", "orga"];
    } else {
      targetRoles = ["admin", "orga"];
    }
    
    // Fetch all members with target roles
    const members = await prisma.member.findMany({
      where: {
        roles: {
          hasSome: targetRoles,
        },
      },
      select: { id: true },
    });
    
    const memberIds = members.map(m => m.id);
    
    // Send individual push notification to each member via OneSignal
    sendOneSignalPushToMultipleUsers(memberIds, pushPayload).catch(error => {
      console.error('Failed to send OneSignal push notifications:', error);
    });
    
    // Invalidate messages page cache for realtime feel
    revalidatePath("/messages");
    revalidatePath("/admin/messages");
    
    // Return the created message so the client can navigate to it
    return NextResponse.json({ success: true, message: created });
  } catch (e) {
    console.error("Create message error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
