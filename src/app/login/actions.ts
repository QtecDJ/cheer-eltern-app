"use server";

import { login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const password = formData.get("password") as string;

  if (!firstName || !password) {
    return { success: false, error: "Vorname und Passwort sind erforderlich" };
  }

  const result = await login(firstName, password);
  
  if (result.success) {
    redirect("/");
  }
  
  return result;
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
