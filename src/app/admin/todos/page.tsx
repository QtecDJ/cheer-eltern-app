import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTodosForAdmin } from "@/lib/queries";
import React from "react";
import Link from "next/link";
import TodoList from "@/components/admin/TodoList";

export const revalidate = 60;

export default async function TodosAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) redirect("/");

  const todos = await getTodosForAdmin({}, 500);
  // reuse `roles` from above
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">ToDo</h1>
        <div>
          <Link href="/admin/todos/new" className="py-1 px-3 bg-primary rounded text-primary-foreground">Neue Aufgabe</Link>
        </div>
      </div>
      <div className="space-y-2">
        {/* @ts-ignore */}
        <TodoList todos={todos} currentUserId={session.id} roles={roles} />
      </div>
    </div>
  );
}
