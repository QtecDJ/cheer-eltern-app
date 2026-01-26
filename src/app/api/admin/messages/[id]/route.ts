import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { getMessageById } from "@/lib/queries";

export async function GET(req: Request, context: any) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.roles ?? session.userRole ?? null)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const msg = await getMessageById(id);
    if (!msg) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true, message: msg });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
