import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Wenn bereits eingeloggt, zur Startseite weiterleiten
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return <LoginForm />;
}
