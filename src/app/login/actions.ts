"use server";

import { login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { clearContentCache } from "@/lib/content-cache";

const CURRENT_VERSION = "1.7.0";
const VERSION_COOKIE = "app_version";

export async function loginAction(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const password = formData.get("password") as string;

  if (!firstName || !lastName || !password) {
    return { success: false, error: "Vorname, Nachname und Passwort sind erforderlich" };
  }

  const result = await login(firstName, lastName, password);
  
  if (result.success) {
    // Prüfe ob Update nötig ist
    const cookieStore = await cookies();
    const lastVersion = cookieStore.get(VERSION_COOKIE)?.value;
    
    // Setze neue Version
    cookieStore.set(VERSION_COOKIE, CURRENT_VERSION, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 Jahr
      path: "/",
    });
    
    // Wenn Version unterschiedlich ist, zeige Update-Seite
    if (lastVersion && lastVersion !== CURRENT_VERSION) {
      redirect("/updating");
    }
    
    redirect("/");
  }
  
  return result;
}

export async function logoutAction() {
  try {
    await logout();
  } catch (error) {
    console.error("Logout error:", error);
  }
  redirect("/login");
}
