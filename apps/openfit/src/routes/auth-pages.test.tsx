import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
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

function renderRouteComponent(component: () => ReactNode) {
	render(component());
}

describe("auth pages", () => {
	it("renders the sign-in form without the register flag", () => {
		renderRouteComponent(SignInRoute.options.component);

		expect(screen.getByTestId("login-form")).toHaveTextContent("signin");
	});

	it("renders the registration form with the register flag", () => {
		renderRouteComponent(RegisterRoute.options.component);

		expect(screen.getByTestId("login-form")).toHaveTextContent("register");
	});
});
