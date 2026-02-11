import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMessageReply, getMessageById } from "@/lib/queries";
import { decryptText } from "@/lib/crypto";
import { sendOneSignalPushByExternalUserId } from "@/lib/onesignal-push";

export async function POST(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const messageId = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const msg = await getMessageById(messageId);
    if (!msg) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // Only allow sender or assignee to reply
    if (msg.senderId !== session.id && msg.assignedTo !== session.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const created = await createMessageReply(messageId, session.id, (body.body || "").toString());
    
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
    return NextResponse.json({ success: true, reply: { id: created.id, body: replyBody, createdAt: created.createdAt, authorId: created.authorId } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
