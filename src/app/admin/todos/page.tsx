import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTodosForAdmin } from "@/lib/queries";
import React from "react";
import Link from "next/link";
import TodoList from "@/components/admin/TodoList";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

export const revalidate = 60;

export default async function TodosAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const roles = (session.roles || []).map(r => (r || "").toString().toLowerCase());
  if (!roles.includes("admin") && !roles.includes("orga")) redirect("/");

  const todos = await getTodosForAdmin({}, 500);
  // reuse `roles` from above
  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Aufgaben</h1>
            <p className="text-sm text-muted-foreground mt-1">Verwalte und organisiere alle Aufgaben</p>
          </div>
          <Link 
            href="/admin/todos/new" 
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-primary rounded-lg text-primary-foreground font-medium shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Aufgabe
          </Link>
        </div>
      </header>
      
      {/* @ts-ignore */}
      <TodoList todos={todos} currentUserId={session.id} roles={roles} />
    </div>
  );
}
