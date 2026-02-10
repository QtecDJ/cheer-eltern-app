import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMessage } from "@/lib/queries";
import { sendPushToStaff } from "@/lib/send-push";

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
    
    // Send push notification to staff
    sendPushToStaff({
      title: `Neue Nachricht: ${subject}`,
      body: message.slice(0, 100) + (message.length > 100 ? '...' : ''),
      url: `/messages/${created.id}`,
      icon: '/icons/icon-192x192.png',
    }).catch(error => {
      console.error('Failed to send push notifications:', error);
      // Don't fail the request if push fails
    });
    
    // Return the created message so the client can navigate to it
    return NextResponse.json({ success: true, message: created });
  } catch (e) {
    console.error("Create message error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
