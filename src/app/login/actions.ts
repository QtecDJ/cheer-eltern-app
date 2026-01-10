"use server";

import { login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "E-Mail und Passwort sind erforderlich" };
  }

  const result = await login(email, password);
  
  if (result.success) {
    redirect("/");
  }
  
  return result;
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
