import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 600;

export default async function BerichtePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Redirect to the combined documents page
  redirect("/dokumente");
}
