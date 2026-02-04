import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTodo, getTodosForAdmin } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { encryptText } from "@/lib/crypto";

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
    
    // Wenn jemand zugewiesen wurde, erstelle eine Nachricht
    if (body.assigneeId) {
      try {
        const messageBody = `Dir wurde eine neue Aufgabe zugewiesen:\n\n**${body.title}**\n\n${body.description || 'Keine Beschreibung'}\n\nPriorität ${body.priority || 'normal'}\nFällig: ${body.dueDate ? new Date(body.dueDate).toLocaleDateString('de-DE') : 'Nicht festgelegt'}\n\n[Zur Aufgabe](/admin/todos/${created.id})`;
        const message = await prisma.message.create({
          data: {
            subject: `Neue Aufgabe: ${body.title}`,
            body: encryptText(messageBody),
            senderId: session.id,
            assignedTo: Number(body.assigneeId),
            status: 'open',
          }
        });
        console.log('✅ Assignment message created:', { messageId: message.id, assignedTo: body.assigneeId, todoId: created.id });
      } catch (msgErr) {
        console.error('❌ Failed to create assignment message:', msgErr);
        // Don't fail the todo creation if message fails
      }
    }
    
    return NextResponse.json({ success: true, todo: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
