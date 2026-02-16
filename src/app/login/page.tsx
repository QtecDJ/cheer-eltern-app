import { LoginForm } from "./login-form";

// Login page is static and rarely changes, cache aggressively
export const revalidate = 3600; // 1 hour

export default function LoginPage() {
  return <LoginForm />;
}
