import { getSession, isAdminOrTrainer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InfoContent } from "./info-content";

// Revalidate every 600 seconds (10 Min) - Info-Inhalte ändern sich selten
export const revalidate = 600;

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
