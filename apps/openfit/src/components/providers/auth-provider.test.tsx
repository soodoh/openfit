import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-provider";

const mockUseSession = vi.fn();

vi.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: (...args: unknown[]) => mockUseSession(...args),
		signIn: vi.fn(),
		signUp: vi.fn(),
		signOut: vi.fn(),
	},
}));

function AuthConsumer() {
	const auth = useAuth();

	return (
		<div data-testid="auth-state">
			{auth.isAuthenticated ? "authenticated" : "anonymous"}-
			{auth.isLoading ? "loading" : "ready"}
		</div>
	);
}

describe("AuthProvider", () => {
	beforeEach(() => {
		mockUseSession.mockReset();
	});

	it("provides authenticated state when a session is present", () => {
		mockUseSession.mockReturnValue({
			data: { id: "session-1" },
			isPending: false,
		});

		render(
			<AuthProvider>
				<AuthConsumer />
			</AuthProvider>,
		);

		expect(screen.getByTestId("auth-state")).toHaveTextContent(
			"authenticated-ready",
		);
		expect(mockUseSession).toHaveBeenCalledTimes(1);
	});

	it("exposes a loading state while the session query is pending", () => {
		mockUseSession.mockReturnValue({
			data: undefined,
			isPending: true,
		});

		render(
			<AuthProvider>
				<AuthConsumer />
			</AuthProvider>,
		);

		expect(screen.getByTestId("auth-state")).toHaveTextContent(
			"anonymous-loading",
		);
	});
});
