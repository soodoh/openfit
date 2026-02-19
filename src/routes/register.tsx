/* eslint-disable eslint-plugin-import(prefer-default-export), typescript-eslint(no-use-before-define) */
import { LoginForm } from "@/components/auth/login-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex flex-1">
      <LoginForm register />
    </div>
  );
}
