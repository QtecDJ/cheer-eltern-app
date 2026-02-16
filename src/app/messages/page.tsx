import React from "react";
import MessageForm from "@/components/messages/MessageForm";
import ComposeButton from "@/components/messages/ComposeButton";
import MessageItem from "@/components/messages/MessageItem";
import { getSession } from "@/lib/auth";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";
import { getMessagesForMember } from "@/lib/queries";
import { Card } from "@/components/ui/card";

// Messages change occasionally, cache for 90 seconds
export const revalidate = 90;

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) return (
    <div className="py-6">Bitte zuerst <a href="/login" className="underline">anmelden</a>.</div>
  );

  const activeProfileId = await getActiveProfileWithParentMapping(session);
  const messages = await getMessagesForMember(activeProfileId, 50);

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between h-10">
        <h1 className="text-2xl font-semibold m-0">Nachrichten</h1>
        <div>
          <ComposeButton compact />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-2">
        {messages.length === 0 ? (
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Du hast noch keine Nachrichten. Nutze das Formular, um uns eine Nachricht zu senden.</div>
          </Card>
        ) : (
          messages.map((m: any) => (
            <MessageItem key={m.id} message={m} />
          ))
        )}
      </div>
    </div>
  );
}
