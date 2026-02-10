import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { assignMessageTo, getMessageById } from "@/lib/queries";
import { sendPushToUser } from "@/lib/send-push";

export async function POST(req: Request, context: any) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.roles ?? session.userRole ?? null)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    await assignMessageTo(id, session.id);
    
    // Send push notification to assigned user (self)
    const msg = await getMessageById(id);
    if (msg) {
      sendPushToUser(session.id, {
        title: 'Nachricht zugewiesen',
        body: `${msg.subject}`,
        url: `/messages/${id}`,
        icon: '/icons/icon-192x192.png',
      }).catch(error => {
        console.error('Failed to send assignment push:', error);
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
