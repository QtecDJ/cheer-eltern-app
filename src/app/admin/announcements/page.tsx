import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";
import AnnouncementsList from "@/components/admin/AnnouncementsList";

// Admin announcements can cache longer
export const revalidate = 120;

export default async function AnnouncementsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  
  const roles = (session.roles || []).map((r: string | null | undefined) => (r || '').toString().toLowerCase());
  if (!roles.includes('admin') && !roles.includes('orga')) redirect('/');

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8">
      <AnnouncementsList currentUserId={session.id} />
    </div>
  );
}
