import { LoginForm } from "./login-form";

// Login page is static and rarely changes, cache aggressively
export const revalidate = 3600; // 1 hour

export default function LoginPage() {
  return (
    <div className="h-screen w-screen overflow-hidden fixed inset-0">
      <LoginForm />
    </div>
  );
}
