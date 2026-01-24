import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { createMessageReply } from "@/lib/queries";

export async function POST(req: Request, context: any) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.roles ?? session.userRole ?? null)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const messageId = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const created = await createMessageReply(messageId, session.id, (body.body || "").toString());
    return NextResponse.json({ success: true, id: created.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
