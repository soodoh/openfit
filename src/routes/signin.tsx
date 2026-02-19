import { LoginForm } from "@/components/auth/LoginForm";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/signin")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="flex flex-1">
      <LoginForm />
    </div>
  );
}
