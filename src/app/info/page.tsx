import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InfoContent } from "./info-content";

export default async function InfoPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Prüfe ob User berechtigt ist (Admin, Trainer, Coach)
  const hasAccess = isAdminOrTrainer(session.userRole);
  
  if (!hasAccess) {
    redirect("/");
  }

  return <InfoContent />;
}
