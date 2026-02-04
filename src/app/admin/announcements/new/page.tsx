import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";
import AnnouncementEditor from "@/components/admin/AnnouncementEditor";

export default async function NewAnnouncementPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  
  const roles = (session.roles || []).map((r: any) => (r || '').toString().toLowerCase());
  if (!roles.includes('admin') && !roles.includes('orga')) redirect('/');

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8">
      <AnnouncementEditor currentUserId={session.id} />
    </div>
  );
}
