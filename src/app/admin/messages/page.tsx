import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMessagesForStaff } from "@/lib/queries";
import React from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const revalidate = 60;

export default async function MessagesAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.userRole || null;
  if (!isAdminOrTrainer(role)) redirect("/");

  const messages = await getMessagesForStaff(100);

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold mb-4">Nachrichten / Tickets</h1>
      <div className="space-y-2">
        {messages.map((m: any) => (
          <Link key={m.id} href={`/admin/messages/${m.id}`}>
            <Card className="p-3 hover:shadow-md cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.subject}</div>
                  <div className="text-xs text-muted-foreground">Von: {m.sender?.firstName ? `${m.sender.firstName} ${m.sender.lastName}` : m.sender?.name}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Status: {m.status}{m.assignedTo ? ` — Zugewiesen` : ""}</div>
            </Card>
          </Link>
        ))}
        {messages.length === 0 && <div className="text-sm text-muted-foreground">Keine offenen Nachrichten.</div>}
      </div>
    </div>
  );
}
