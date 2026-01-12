import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EinstellungenContent } from "./einstellungen-content";

export default async function EinstellungenPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const member = await prisma.member.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      email: true,
      emergencyContact: true,
      emergencyPhone: true,
      emergencyContact2: true,
      emergencyPhone2: true,
      allergies: true,
      diseases: true,
      medications: true,
    },
  });

  if (!member) {
    redirect("/login");
  }

  return <EinstellungenContent member={member} />;
}
