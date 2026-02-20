import { LoginForm } from "@/components/auth/login-form";
import { createFileRoute } from "@tanstack/react-router";
function SignInPage() {
  return (
    <div className="flex flex-1">
      <LoginForm />
    </div>
  );
}
export const Route = createFileRoute("/signin")({
  component: SignInPage,
});
export default Route;
