import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { createMessageForAssignees } from "@/lib/queries";
import { sendOneSignalPushToMultipleUsers } from "@/lib/onesignal-push";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.roles ?? session.userRole ?? null)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    
    // Validiere assignees: nur positive Integer
    const assignees: number[] = Array.isArray(body.assignees) 
      ? body.assignees
          .map((n: any) => Number(n))
          .filter((n: number) => Number.isInteger(n) && n > 0)
      : [];
      
    if (!assignees.length) {
      return NextResponse.json({ error: "no_assignees" }, { status: 400 });
    }
    
    // Validiere subject und body
    const subject: string = (body.subject || "").toString().trim();
    const message: string = (body.body || "").toString().trim();
    
    if (!subject || subject.length > 255) {
      return NextResponse.json({ error: "invalid_subject" }, { status: 400 });
    }
    
    if (!message || message.length > 10000) {
      return NextResponse.json({ error: "invalid_message" }, { status: 400 });
    }
    
    const created = await createMessageForAssignees({ 
      subject, 
      body: message, 
      senderId: session.id, 
      assignees 
    });
    
    // Send push notification to all recipients via OneSignal
    sendOneSignalPushToMultipleUsers(assignees, {
      title: `Infinity Cheer Allstars`,
      body: `Neue Nachricht: ${subject}`,
      url: `/messages`,
      icon: '/icons/icon-192x192.png',
    }).catch(error => {
      console.error('Failed to send OneSignal push to recipients:', error);
    });
    
    return NextResponse.json({ success: true, createdCount: created.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
