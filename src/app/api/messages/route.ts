import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMessage } from "@/lib/queries";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const subject = (body.subject || "").toString().slice(0, 255);
    const message = (body.message || "").toString();
    if (!subject || !message) return NextResponse.json({ error: "missing" }, { status: 400 });

    const created = await createMessage({ subject, body: message, senderId: session.id });
    // Return the created message so the client can navigate to it
    return NextResponse.json({ success: true, message: created });
  } catch (e) {
    console.error("Create message error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
