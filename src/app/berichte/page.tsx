import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BerichteContent } from "./berichte-content";

export const revalidate = 600;

export default async function BerichtePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 max-w-lg md:max-w-none mx-auto">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">Berichte</h1>
      <p className="text-muted-foreground mb-4">Hier findest du alle veröffentlichten Berichte als PDF zum Download oder Lesen.</p>
      <BerichteContent />
    </div>
  );
}
