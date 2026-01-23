import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { createMessageReply } from "@/lib/queries";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.userRole || null)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const messageId = Number(params.id);
    const created = await createMessageReply(messageId, session.id, (body.body || "").toString());
    return NextResponse.json({ success: true, id: created.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
