import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMessage } from "@/lib/queries";
import { sendOneSignalPushToMultipleUsers } from "@/lib/onesignal-push";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const subject = (body.subject || "").toString().slice(0, 255);
    const message = (body.message || "").toString();
    const target = (body.target || body.target === "" ? body.target : "admins").toString();
    if (!subject || !message) return NextResponse.json({ error: "missing" }, { status: 400 });

    const created = await createMessage({ subject, body: message, senderId: session.id, target });
    
    // Send push notification based on target audience
    const pushPayload = {
      title: `Infinity Cheer Allstars`,
      body: `Neue Nachricht: ${subject}`,
      url: `/messages/${created.id}`,
      icon: '/icons/icon-192x192.png',
    };
    
    // Get all members with the target roles and send individual notifications
    let targetRoles: string[] = [];
    if (target === "admins") {
      targetRoles = ["admin"];
    } else if (target === "orga") {
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
    
    // Return the created message so the client can navigate to it
    return NextResponse.json({ success: true, message: created });
  } catch (e) {
    console.error("Create message error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
