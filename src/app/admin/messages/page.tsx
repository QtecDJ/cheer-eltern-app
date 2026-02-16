import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMessagesForStaff, getActiveTeamsWithMembers } from "@/lib/queries";
import TicketBoard from "@/components/admin/TicketBoard";

// Admin messages view can cache longer
export const revalidate = 120;

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
  const isAdmin = rolesStr.toLowerCase().includes("admin");
  
  if (rolesStr.toLowerCase().includes("orga") && !isAdmin) {
    filtered = messages.filter((m: any) => (m.audience || "admins") === "orga");
  }

  // If a message is assigned to a specific person, only that person (or admins) should see it
  filtered = filtered.filter((m: any) => {
    if (!m.assignedTo) return true;
    if (isAdmin) return true;
    return m.assignedTo === session.id;
  });

  return (
    <div className="px-4 pt-6 pb-24 h-[calc(100vh-5rem)]">
      <TicketBoard
        initialMessages={filtered}
        teams={teams}
        currentUserId={session.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
