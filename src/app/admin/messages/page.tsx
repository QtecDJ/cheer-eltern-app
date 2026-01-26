import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMessagesForStaff, getActiveTeamsWithMembers } from "@/lib/queries";
import React from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import MessageActions from "@/components/admin/MessageActions";
import AdminMessagesList from "@/components/admin/AdminMessagesList";
import AdminMessageModal from "@/components/admin/AdminMessageModal";

export const revalidate = 60;

export default async function MessagesAdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminOrTrainer(session.roles ?? session.userRole ?? null)) redirect("/");

  // Include resolved messages for admins so they can review/delete them
  const messages = await getMessagesForStaff(100, true);
  const teams = await getActiveTeamsWithMembers();
  // If the current session is only 'orga', show only messages targeted to Orga
  let filtered = messages;
  const rolesStr = session.roles ? (session.roles as string[]).join(",") : (session.userRole || "");
  if (rolesStr.toLowerCase().includes("orga") && !rolesStr.toLowerCase().includes("admin")) {
    filtered = messages.filter((m: any) => (m.audience || "admins") === "orga");
  }

  // If a message is assigned to a specific person, only that person (or admins) should see it
  const isAdmin = rolesStr.toLowerCase().includes("admin");
  filtered = filtered.filter((m: any) => {
    if (!m.assignedTo) return true;
    if (isAdmin) return true;
    return m.assignedTo === session.id;
  });

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        {/* @ts-ignore */}
        <div>
          <AdminMessageModal teams={teams} />
        </div>
      </div>
      <div className="space-y-2">
        {(() => {
          // Group messages by sender team name
          const groups: Record<string, any[]> = {};
          for (const m of filtered) {
            const teamName = m.sender?.team?.name || "Keine Mannschaft";
            if (!groups[teamName]) groups[teamName] = [];
            groups[teamName].push(m);
          }

          return Object.entries(groups).map(([team, msgs]) => (
            <div key={team}>
              <div className="text-sm font-medium mb-1">{team} ({msgs.length})</div>
              <div className="space-y-2">
                {/* @ts-ignore */}
                <AdminMessagesList messages={msgs} />
              </div>
            </div>
          ));
        })()}
        {filtered.length === 0 && <div className="text-sm text-muted-foreground">Keine offenen Nachrichten.</div>}
      </div>
    </div>
  );
}
