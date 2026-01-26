import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DokumenteTabs from "./dokumente-tabs";

// Revalidate every 600 seconds (10 Min)
export const revalidate = 600;

export default async function DokumentePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <DokumenteTabs />;
}
