import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	it("provides authenticated state when a session is present", async () => {
		mockUseSession.mockReturnValue({
			data: { id: "session-1" },
			isPending: false,
		});

		const screen = await render(
			<AuthProvider>
				<AuthConsumer />
			</AuthProvider>,
		);

		await expect
			.element(screen.getByTestId("auth-state"))
			.toHaveTextContent("authenticated-ready");
		expect(mockUseSession).toHaveBeenCalledTimes(1);
	});

	it("exposes a loading state while the session query is pending", async () => {
		mockUseSession.mockReturnValue({
			data: undefined,
			isPending: true,
		});

		const screen = await render(
			<AuthProvider>
				<AuthConsumer />
			</AuthProvider>,
		);

		await expect
			.element(screen.getByTestId("auth-state"))
			.toHaveTextContent("anonymous-loading");
	});
});
