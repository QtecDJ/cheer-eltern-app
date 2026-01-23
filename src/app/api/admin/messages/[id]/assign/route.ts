import { NextResponse } from "next/server";
import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { assignMessageTo } from "@/lib/queries";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !isAdminOrTrainer(session.userRole || null)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const assigneeId = body.assigneeId ?? null;
    const id = Number(params.id);
    await assignMessageTo(id, assigneeId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
