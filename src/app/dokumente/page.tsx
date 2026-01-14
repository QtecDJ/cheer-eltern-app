import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DokumenteContent } from "./dokumente-content";

export default async function DokumentePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Prüfe ob User berechtigt ist (Admin, Trainer, Coach)
  const hasAccess = isAdminOrTrainer(session.userRole);
  
  if (!hasAccess) {
    redirect("/");
  }

  return <DokumenteContent />;
}
