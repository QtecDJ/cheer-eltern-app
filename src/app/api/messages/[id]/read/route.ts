import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMessageById } from "@/lib/queries";

export async function POST(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const msg = await getMessageById(id);
    if (!msg) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // Only allow assignee or sender to mark as read; do NOT change status here.
    if (msg.assignedTo !== session.id && msg.senderId !== session.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
