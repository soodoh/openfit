import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/login-form";

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
