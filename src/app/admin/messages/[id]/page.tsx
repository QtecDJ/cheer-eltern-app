import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMessageById } from "@/lib/queries";
import React from "react";
import { Card } from "@/components/ui/card";
import MessageActions from "@/components/admin/MessageActions";

export default async function MessageDetailPage({ params }: { params: any }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminOrTrainer(session.roles ?? session.userRole ?? null)) redirect("/");
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  const message = await getMessageById(id);
  if (!message) return <div className="py-6">Nachricht nicht gefunden.</div>;

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold mb-4">Nachricht: {message.subject}</h1>

      <Card className="p-4 mb-4">
        <div className="text-sm text-muted-foreground">Von: {message.sender?.firstName ? `${message.sender.firstName} ${message.sender.lastName}` : message.sender?.name}</div>
        <div className="text-xs text-muted-foreground">Erstellt: {new Date(message.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        <div className="mt-3 whitespace-pre-wrap">{message.body}</div>
      </Card>

      <Card className="p-4 mb-4">
        <h2 className="font-medium mb-2">Antworten</h2>
        {message.replies && message.replies.length > 0 ? (
          <div className="space-y-2">
            {message.replies.map((r: any) => (
              <div key={r.id} className="p-2 border rounded">
                <div className="text-xs text-muted-foreground">{r.author?.firstName ? `${r.author.firstName} ${r.author.lastName}` : r.author?.name} — {new Date(r.createdAt).toLocaleString()}</div>
                <div className="mt-1 text-sm whitespace-pre-wrap">{r.body}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Noch keine Antworten.</div>
        )}
      </Card>

      <MessageActions messageId={id} />
    </div>
  );
}
