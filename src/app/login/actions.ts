"use server";

import { login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!name || !password) {
    return { success: false, error: "Name und Passwort sind erforderlich" };
  }

  const result = await login(name, password);
  
  if (result.success) {
    redirect("/");
  }
  
  return result;
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
