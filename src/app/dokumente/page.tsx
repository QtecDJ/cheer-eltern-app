import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DokumenteContent } from "./dokumente-content";

export default async function DokumentePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  return <DokumenteContent />;
}
