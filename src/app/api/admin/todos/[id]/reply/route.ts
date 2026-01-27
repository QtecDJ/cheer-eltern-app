import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTodoComment, getTodoById } from "@/lib/queries";

export async function GET(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const t = await getTodoById(id);
    if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // return comments from included relation
    return NextResponse.json({ comments: t.comments || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const body = await req.json();
    if (!body?.body) return NextResponse.json({ error: "missing_body" }, { status: 400 });
    const created = await createTodoComment({ todoId: id, authorId: session.id, body: body.body });
    return NextResponse.json({ success: true, comment: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
