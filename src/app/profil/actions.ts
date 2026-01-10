"use server";

import { prisma } from "@/lib/db";
import { getSession, hashPassword, updateSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateEmail(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Nicht eingeloggt" };
  }

  const email = formData.get("email") as string;
  
  if (!email || !email.includes("@")) {
    return { success: false, error: "Bitte gib eine gültige E-Mail ein" };
  }

  try {
    // Prüfe ob E-Mail schon vergeben ist
    const existing = await prisma.member.findFirst({
      where: { 
        email: email,
        id: { not: session.id }
      },
    });

    if (existing) {
      return { success: false, error: "Diese E-Mail wird bereits verwendet" };
    }

    // Prüfe ob User bereits eine E-Mail hat
    const currentUser = await prisma.member.findUnique({
      where: { id: session.id },
      select: { email: true },
    });

    if (currentUser?.email) {
      return { success: false, error: "E-Mail kann nicht mehr geändert werden" };
    }

    // E-Mail einmalig setzen
    await prisma.member.update({
      where: { id: session.id },
      data: { email },
    });

    // Session aktualisieren
    await updateSession({ email });

    revalidatePath("/profil");
    return { success: true };
  } catch (error) {
    console.error("Update email error:", error);
    return { success: false, error: "Fehler beim Speichern" };
  }
}

export async function updatePassword(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Nicht eingeloggt" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Alle Felder sind erforderlich" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwörter stimmen nicht überein" };
  }

  if (newPassword.length < 4) {
    return { success: false, error: "Passwort muss mindestens 4 Zeichen haben" };
  }

  try {
    const user = await prisma.member.findUnique({
      where: { id: session.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return { success: false, error: "Kein Passwort gesetzt" };
    }

    // Prüfe aktuelles Passwort
    const bcrypt = await import("bcryptjs");
    let isValid = false;
    
    if (user.passwordHash.startsWith("$2")) {
      isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    } else {
      isValid = currentPassword === user.passwordHash;
    }

    if (!isValid) {
      return { success: false, error: "Aktuelles Passwort ist falsch" };
    }

    // Neues Passwort setzen
    const hashedPassword = await hashPassword(newPassword);
    await prisma.member.update({
      where: { id: session.id },
      data: { passwordHash: hashedPassword },
    });

    revalidatePath("/profil");
    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { success: false, error: "Fehler beim Speichern" };
  }
}

export async function updateEmergencyContact(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Nicht eingeloggt" };
  }

  const emergencyContact = formData.get("emergencyContact") as string;
  const emergencyPhone = formData.get("emergencyPhone") as string;

  try {
    await prisma.member.update({
      where: { id: session.id },
      data: { 
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
      },
    });

    revalidatePath("/profil");
    return { success: true };
  } catch (error) {
    console.error("Update emergency contact error:", error);
    return { success: false, error: "Fehler beim Speichern" };
  }
}
