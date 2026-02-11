import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { createMessageReply, getMessageById } from "@/lib/queries";
import { sendOneSignalPushByExternalUserId } from "@/lib/onesignal-push";

export async function POST(req: Request, context: any) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.roles ?? session.userRole ?? null)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const messageId = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    
    // Get message to find sender
    const msg = await getMessageById(messageId);
    
    const created = await createMessageReply(messageId, session.id, (body.body || "").toString());
    
    // Send OneSignal push notification to sender
    if (msg && msg.senderId) {
      sendOneSignalPushByExternalUserId(`member_${msg.senderId}`, {
        title: `Infinity Cheer Allstars`,
        body: `Antwort: ${msg.subject}`,
        url: `/messages/${messageId}`,
        icon: '/icons/icon-192x192.png',
      }).catch(error => {
        console.error('Failed to send OneSignal push:', error);
      });
    }
    
    return NextResponse.json({ success: true, reply: { id: created.id, body: created.body, createdAt: created.createdAt, author: created.author } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
