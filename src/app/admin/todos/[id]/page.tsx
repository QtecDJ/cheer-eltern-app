import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTodoById } from "@/lib/queries";
import React from "react";
import TodoDetail from "@/components/admin/TodoDetail";
import TodoDetailClientFallback from "@/components/admin/TodoDetailClient";

// Admin todo details can cache longer
export const revalidate = 120;

export default async function TodoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const roles = (session.roles || []).map((r: any) => (r || '').toString().toLowerCase());
  if (!roles.includes('admin') && !roles.includes('orga')) redirect('/');
  
  const resolvedParams = await params;
  if (!resolvedParams || !resolvedParams.id) {
    // Server didn't provide params (edge cases). Fallback to client fetch.
    return (
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Aufgabe wird geladen...</h1>
        {/* client fallback will read URL and fetch the todo */}
        {/* @ts-ignore */}
        <TodoDetailClientFallback currentUserId={session.id} roles={roles} />
      </div>
    );
  }

  const id = Number(resolvedParams.id);
  if (!Number.isFinite(id) || id <= 0) return redirect('/admin/todos');
  const todo = await getTodoById(id);
  if (!todo) {
    return (
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Aufgabe nicht gefunden</h1>
        <p className="text-muted-foreground">Die gesuchte Aufgabe existiert nicht oder wurde gelöscht.</p>
      </div>
    );
  }

  // @ts-ignore
  return <TodoDetail todo={todo} currentUserId={session.id} roles={roles} />;
}
