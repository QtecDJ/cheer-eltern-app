import { getMemberSettings } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EinstellungenContent } from "./einstellungen-content";

// Revalidate every 600 seconds (10 Min) - Settings ändern sich sehr selten
export const revalidate = 600;

export default async function EinstellungenPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const member = await getMemberSettings(session.id);

  if (!member) {
    redirect("/login");
  }

  return <EinstellungenContent member={member} />;
}
