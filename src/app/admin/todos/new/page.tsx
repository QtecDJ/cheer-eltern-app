import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";
import TodoForm from "@/components/admin/TodoForm";

export default async function NewTodoPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const roles = (session.roles || []).map((r: any) => (r || '').toString().toLowerCase());
  if (!roles.includes('admin') && !roles.includes('orga')) redirect('/');

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Neue Aufgabe</h1>
      </div>
      {/* @ts-ignore */}
      <TodoForm currentUserId={session.id} />
    </div>
  );
}
