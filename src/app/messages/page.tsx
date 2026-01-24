import React from "react";
import MessageForm from "@/components/messages/MessageForm";
import ComposeButton from "@/components/messages/ComposeButton";
import { getSession } from "@/lib/auth";
import { getMessagesForMember } from "@/lib/queries";
import { Card } from "@/components/ui/card";

export const revalidate = 0;

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) return (
    <div className="py-6">Bitte zuerst <a href="/login" className="underline">anmelden</a>.</div>
  );

  const messages = await getMessagesForMember(session.id, 50);

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Nachrichten</h1>
        <div className="grid grid-cols-1 gap-3">
          {messages.length === 0 ? (
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Du hast noch keine Nachrichten. Nutze das Formular, um uns eine Nachricht zu senden.</div>
            </Card>
          ) : (
            messages.map((m: any) => (
              <Card key={m.id} id={`msg-${m.id}`} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{m.subject}</div>
                    <div className="text-xs text-muted-foreground">Erstellt: {new Date(m.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} — Status: {m.status}</div>
                  </div>
                  <div>
                    {m.status === 'open' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Offen</span>}
                    {m.status === 'assigned' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Zugewiesen</span>}
                    {m.status === 'resolved' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Erledigt</span>}
                  </div>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm">{m.body}</div>

                {m.replies && m.replies.length > 0 && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    {m.replies.map((r: any) => (
                      <div key={r.id} className="p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">{r.author?.firstName ? `${r.author.firstName} ${r.author.lastName}` : r.author?.name} — {new Date(r.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="mt-1 text-sm whitespace-pre-wrap">{r.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto flex justify-center">
        <ComposeButton />
      </div>
    </div>
  );
}
