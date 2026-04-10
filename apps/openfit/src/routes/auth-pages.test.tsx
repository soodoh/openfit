import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import RegisterRoute from "./register";
import SignInRoute from "./signin";

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
		"@tanstack/react-router",
	);

	return {
		...actual,
	};
});

vi.mock("@/components/auth/login-form", () => ({
	LoginForm: ({ register }: { register?: boolean }) => (
		<div data-testid="login-form">{register ? "register" : "signin"}</div>
	),
}));

describe("auth pages", () => {
	it("renders the sign-in form without the register flag", async () => {
		const screen = await render(SignInRoute.options.component());

		await expect
			.element(screen.getByTestId("login-form"))
			.toHaveTextContent("signin");
	});

	it("renders the registration form with the register flag", async () => {
		const screen = await render(RegisterRoute.options.component());

		await expect
			.element(screen.getByTestId("login-form"))
			.toHaveTextContent("register");
	});
});
