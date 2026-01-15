import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DokumenteContent } from "./dokumente-content";

// Revalidate every 600 seconds (10 Min) - Dokumente ändern sich sehr selten
export const revalidate = 600;

export default async function DokumentePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  return <DokumenteContent />;
}
