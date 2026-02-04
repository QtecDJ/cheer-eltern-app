import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTodoById, updateTodo, changeTodoStatus, assignTodo, deleteTodo } from "@/lib/queries";
import { prisma } from "@/lib/db";import { encryptText } from "@/lib/crypto";
export async function GET(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const t = await getTodoById(id);
    if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ todo: t });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const todo = await getTodoById(id);
    if (!todo) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const isPrivileged = roles.includes("admin") || roles.includes("orga") || (session.id && Number(session.id) === Number(todo.creatorId));
    if (!isPrivileged) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const body = await req.json();
    // Support status change, assign, and updates
    if (body.status) {
      // allow status change for creator or admins/orgas (checked above)
      const updated = await changeTodoStatus(id, body.status);
      return NextResponse.json({ success: true, todo: updated });
    }
    if (typeof body.assigneeId !== "undefined") {
      // only admins/orgas may change assignment
      if (!roles.includes("admin") && !roles.includes("orga")) return NextResponse.json({ error: "forbidden_assignee" }, { status: 403 });
      if (body.assigneeId !== null) {
        const member = await prisma.member.findUnique({ where: { id: Number(body.assigneeId) }, select: { roles: true, userRole: true } });
        const rolesStr = (member?.roles && member.roles.length ? member.roles : (member?.userRole ? member.userRole.split(',').map((r:string)=>r.trim()) : [])).map((r:any)=>r.toLowerCase());
        if (!rolesStr.includes("admin") && !rolesStr.includes("orga")) return NextResponse.json({ error: "assignee_must_be_admin_or_orga" }, { status: 400 });
      }
      const updated = await assignTodo(id, body.assigneeId === null ? null : Number(body.assigneeId));
      
      // Wenn jemand neu zugewiesen wurde, erstelle eine Nachricht
      if (body.assigneeId && Number(body.assigneeId) !== todo.assigneeId) {
        try {
          const messageBody = `Dir wurde eine Aufgabe zugewiesen:\n\n**${todo.title}**\n\n${todo.description || 'Keine Beschreibung'}\n\nPriorität: ${todo.priority || 'normal'}\n\n[Zur Aufgabe](/admin/todos/${id})`;
          await prisma.message.create({
            data: {
              subject: `Aufgabe zugewiesen: ${todo.title}`,
              body: encryptText(messageBody),
              senderId: session.id,
              assignedTo: Number(body.assigneeId),
              status: 'open',
            }
          });
        } catch (msgErr) {
          console.error('Failed to create assignment message:', msgErr);
        }
      }
      
      return NextResponse.json({ success: true, todo: updated });
    }
    
    // Allow partial updates - only update fields that are provided
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    
    const updated = await updateTodo(id, updateData);
    return NextResponse.json({ success: true, todo: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  try {
    const id = Number((context?.params && (await context.params).id) ?? context?.params?.id ?? context?.params);
    const todo = await getTodoById(id);
    if (!todo) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const isPrivileged = roles.includes("admin") || roles.includes("orga") || (session.id && Number(session.id) === Number(todo.creatorId));
    if (!isPrivileged) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await deleteTodo(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
