import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTodo, getTodosForAdmin } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const url = new URL(req.url);
    const status = url.searchParams.getAll("status");
    const priority = url.searchParams.getAll("priority");
    const mine = url.searchParams.get("mine");
    const assignedTo = url.searchParams.get("assignedTo");
    const filters: any = {};
    if (status && status.length > 0) filters.status = status;
    if (priority && priority.length > 0) filters.priority = priority;
    if (mine) filters.mine = Number(mine);
    if (assignedTo) filters.assignedTo = Number(assignedTo);
    const rows = await getTodosForAdmin(filters, 500);
    return NextResponse.json({ todos: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    if (!body?.title) return NextResponse.json({ error: "missing_title" }, { status: 400 });
    const created = await createTodo({ title: body.title, description: body.description, priority: body.priority, dueDate: body.dueDate ? new Date(body.dueDate) : null, creatorId: session.id, assigneeId: body.assigneeId ?? null });
    return NextResponse.json({ success: true, todo: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
