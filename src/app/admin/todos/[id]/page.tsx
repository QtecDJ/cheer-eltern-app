import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTodoById } from "@/lib/queries";
import React from "react";
import TodoDetail from "@/components/admin/TodoDetail";
import TodoDetailClientFallback from "@/components/admin/TodoDetailClient";

export const revalidate = 60;

export default async function TodoDetailPage({ params }: { params?: { id?: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const roles = (session.roles || []).map((r: any) => (r || '').toString().toLowerCase());
  if (!roles.includes('admin') && !roles.includes('orga')) redirect('/');
  if (!params || !params.id) {
    // Server didn't provide params (edge cases). Fallback to client fetch.
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold mb-4">Aufgabe</h1>
        {/* client fallback will read URL and fetch the todo */}
        {/* @ts-ignore */}
        <TodoDetailClientFallback currentUserId={session.id} roles={roles} />
      </div>
    );
  }

  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) return redirect('/admin/todos');
  const todo = await getTodoById(id);
  if (!todo) return <div className="py-6">Aufgabe nicht gefunden.</div>;

  // @ts-ignore
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold mb-4">Aufgabe</h1>
      {/* @ts-ignore */}
      <TodoDetail todo={todo} currentUserId={session.id} roles={roles} />
    </div>
  );
}
