import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { createMessageForAssignees } from "@/lib/queries";
import { sendPushToMultipleUsers } from "@/lib/send-push";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.roles ?? session.userRole ?? null)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const assignees: number[] = Array.isArray(body.assignees) ? body.assignees.map((n: any) => Number(n)).filter(Boolean) : [];
    if (!assignees.length) return NextResponse.json({ error: "no_assignees" }, { status: 400 });
    const subject: string = (body.subject || "").toString();
    const message: string = (body.body || "").toString();
    const created = await createMessageForAssignees({ subject, body: message, senderId: session.id, assignees });
    
    // Send push notification to all recipients
    sendPushToMultipleUsers(assignees, {
      title: `Neue Nachricht: ${subject}`,
      body: message.slice(0, 100) + (message.length > 100 ? '...' : ''),
      url: `/messages`,
      icon: '/icons/icon-192x192.png',
    }).catch(error => {
      console.error('Failed to send push to recipients:', error);
    });
    
    return NextResponse.json({ success: true, createdCount: created.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
