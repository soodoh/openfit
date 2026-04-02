import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/login-form";

function RegisterPage() {
	return (
		<div className="flex flex-1">
			<LoginForm register />
		</div>
	);
}
export const Route = createFileRoute("/register")({
	component: RegisterPage,
});
export default Route;
