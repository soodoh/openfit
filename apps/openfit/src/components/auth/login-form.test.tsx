import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { LoginForm } from "./login-form";

const mockNavigate = vi.fn();
const mockSignInEmail = vi.fn();
const mockSignInSocial = vi.fn();
const mockSignInOauth2 = vi.fn();
const mockSignUpEmail = vi.fn();
const mockUseAuth = vi.fn();
const mockGetSession = vi.fn();
const mockFetch = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
		<a href={to} {...props} rel="noreferrer">
			{children}
		</a>
	),
	useNavigate: () => mockNavigate,
}));

vi.mock("@/components/providers/auth-provider", () => ({
	signIn: {
		email: (...args: unknown[]) => mockSignInEmail(...args),
		social: (...args: unknown[]) => mockSignInSocial(...args),
		oauth2: (...args: unknown[]) => mockSignInOauth2(...args),
	},
	signUp: {
		email: (...args: unknown[]) => mockSignUpEmail(...args),
	},
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/auth-client", () => ({
	getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe("LoginForm redirects", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", mockFetch);
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: true,
				},
				bootstrapAvailable: false,
				providers: [],
			}),
		});
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
		mockSignInEmail.mockResolvedValue({ error: null });
		mockSignInSocial.mockResolvedValue({ error: null });
		mockSignInOauth2.mockResolvedValue({ error: null });
		mockSignUpEmail.mockResolvedValue({ error: null });
		mockGetSession.mockResolvedValue({
			data: { session: { id: "session-1" } },
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("redirects to home when already authenticated", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

		await render(<LoginForm />);

		await vi.waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/", replace: true });
		});
	});

	it("refreshes session and redirects after email login", async () => {
		const screen = await render(<LoginForm />);

		await screen.getByLabelText("Email").fill("person@example.com");
		await screen.getByLabelText("Password").fill("Password1!");
		await userEvent.click(screen.getByRole("button", { name: "Login" }));

		await vi.waitFor(() => {
			expect(mockSignInEmail).toHaveBeenCalledWith({
				email: "person@example.com",
				password: "Password1!",
			});
			expect(mockGetSession).toHaveBeenCalledTimes(1);
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/", replace: true });
		});
	});

	it("shows an error when session is missing after successful login", async () => {
		mockGetSession.mockResolvedValue({
			data: null,
			error: { message: "missing" },
		});

		const screen = await render(<LoginForm />);

		await screen.getByLabelText("Email").fill("person@example.com");
		await screen.getByLabelText("Password").fill("Password1!");
		await userEvent.click(screen.getByRole("button", { name: "Login" }));

		await vi.waitFor(() => {
			expect(mockNavigate).not.toHaveBeenCalled();
		});
		await expect
			.element(
				screen.getByText("Authentication succeeded but session was not ready"),
			)
			.toBeInTheDocument();
	});

	it("shows validation errors and blocks submission when the form is invalid", async () => {
		const screen = await render(<LoginForm />);

		await screen.getByLabelText("Email").fill("invalid");
		await screen.getByLabelText("Password").fill("abc");
		await userEvent.click(screen.getByRole("button", { name: "Login" }));

		await vi.waitFor(() => {
			expect(mockSignInEmail).not.toHaveBeenCalled();
		});
		await expect.element(screen.getByText("Invalid email")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Be at least 8 characters long"))
			.toBeInTheDocument();
		expect(mockSignInEmail).not.toHaveBeenCalled();
		expect(mockGetSession).not.toHaveBeenCalled();
	});

	it("shows sign-in API errors and does not refresh session", async () => {
		mockSignInEmail.mockResolvedValue({
			error: { message: "Invalid email or password" },
		});

		const screen = await render(<LoginForm />);

		await screen.getByLabelText("Email").fill("person@example.com");
		await screen.getByLabelText("Password").fill("Password1!");
		await userEvent.click(screen.getByRole("button", { name: "Login" }));

		await vi.waitFor(() => {
			expect(mockGetSession).not.toHaveBeenCalled();
		});
		await expect
			.element(screen.getByText("Invalid email or password"))
			.toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("registers a new account when register mode is enabled", async () => {
		const screen = await render(<LoginForm register />);

		await screen.getByLabelText("Email").fill("newperson@example.com");
		await screen.getByLabelText("Password").fill("Password1!");
		await userEvent.click(screen.getByRole("button", { name: "Register" }));

		await vi.waitFor(() => {
			expect(mockSignUpEmail).toHaveBeenCalledWith({
				email: "newperson@example.com",
				password: "Password1!",
				name: "newperson",
			});
			expect(mockGetSession).toHaveBeenCalledTimes(1);
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/", replace: true });
		});
	});

	it("shows the fallback error when sign-in throws a non-Error", async () => {
		mockSignInEmail.mockRejectedValueOnce("boom");

		const screen = await render(<LoginForm />);

		await screen.getByLabelText("Email").fill("person@example.com");
		await screen.getByLabelText("Password").fill("Password1!");
		await userEvent.click(screen.getByRole("button", { name: "Login" }));

		await expect
			.element(screen.getByText("Authentication failed"))
			.toBeInTheDocument();
		expect(mockGetSession).not.toHaveBeenCalled();
	});

	it("shows registration errors when sign-up fails", async () => {
		mockSignUpEmail.mockResolvedValueOnce({
			error: { message: "Registration failed" },
		});

		const screen = await render(<LoginForm register />);

		await screen.getByLabelText("Email").fill("newperson@example.com");
		await screen.getByLabelText("Password").fill("Password1!");
		await userEvent.click(screen.getByRole("button", { name: "Register" }));

		await expect
			.element(screen.getByText("Registration failed"))
			.toBeInTheDocument();
		expect(mockGetSession).not.toHaveBeenCalled();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("starts social OAuth sign-in when Google is enabled", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: true,
				},
				bootstrapAvailable: false,
				providers: [
					{
						id: "google",
						name: "Google",
						type: "social",
					},
				],
			}),
		});

		const screen = await render(<LoginForm />);

		await userEvent.click(
			screen.getByRole("button", { name: "Continue with Google" }),
		);

		expect(mockSignInSocial).toHaveBeenCalledWith({
			provider: "google",
			callbackURL: "/",
		});
	});

	it("shows a social OAuth error when the provider flow throws", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: true,
				},
				bootstrapAvailable: false,
				providers: [
					{
						id: "google",
						name: "Google",
						type: "social",
					},
				],
			}),
		});
		mockSignInSocial.mockRejectedValueOnce(new Error("oauth failed"));

		const screen = await render(<LoginForm />);

		await userEvent.click(
			screen.getByRole("button", { name: "Continue with Google" }),
		);

		await expect.element(screen.getByText("oauth failed")).toBeInTheDocument();
	});

	it("renders OIDC providers from the provider status API", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: true,
				},
				bootstrapAvailable: false,
				providers: [
					{
						id: "authentik",
						name: "Authentik",
						type: "oidc",
						allowAccountCreation: true,
					},
				],
			}),
		});

		const screen = await render(<LoginForm />);

		await userEvent.click(
			screen.getByRole("button", { name: "Continue with Authentik" }),
		);

		expect(mockSignInOauth2).toHaveBeenCalledWith({
			providerId: "authentik",
			callbackURL: "/",
		});
	});

	it("passes requestSignUp for OIDC during first-user bootstrap", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: true,
				},
				bootstrapAvailable: true,
				providers: [
					{
						id: "authentik",
						name: "Authentik",
						type: "oidc",
						allowAccountCreation: false,
					},
				],
			}),
		});

		const screen = await render(<LoginForm />);

		await userEvent.click(
			screen.getByRole("button", { name: "Continue with Authentik" }),
		);

		expect(mockSignInOauth2).toHaveBeenCalledWith({
			providerId: "authentik",
			callbackURL: "/",
			requestSignUp: true,
		});
	});

	it("hides email registration controls when registration is disabled", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: false,
				},
				bootstrapAvailable: false,
				providers: [],
			}),
		});

		const screen = await render(<LoginForm register />);

		await expect
			.element(screen.getByText("Email/password registration is disabled"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Register" }))
			.not.toBeInTheDocument();
	});

	it("hides the create account link when registration is disabled", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: false,
				},
				bootstrapAvailable: false,
				providers: [],
			}),
		});

		const screen = await render(<LoginForm />);

		await expect
			.element(screen.getByRole("link", { name: "Create an account" }))
			.not.toBeInTheDocument();
	});

	it("does not expose registration controls in register mode when provider status returns non-OK", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({}),
		});

		const screen = await render(<LoginForm register />);

		await expect
			.element(screen.getByText("Email/password registration is disabled"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByLabelText("Email"))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Register" }))
			.not.toBeInTheDocument();
	});

	it("does not expose registration controls in register mode when provider status rejects", async () => {
		mockFetch.mockRejectedValueOnce(new Error("provider status failed"));

		const screen = await render(<LoginForm register />);

		await expect
			.element(screen.getByText("Email/password registration is disabled"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByLabelText("Email"))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Register" }))
			.not.toBeInTheDocument();
	});

	it("does not show create account when provider status returns non-OK", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({}),
		});

		const screen = await render(<LoginForm />);

		await expect.element(screen.getByLabelText("Email")).toBeInTheDocument();
		await expect
			.element(screen.getByRole("link", { name: "Create an account" }))
			.not.toBeInTheDocument();
	});

	it("does not show create account when provider status rejects", async () => {
		mockFetch.mockRejectedValueOnce(new Error("provider status failed"));

		const screen = await render(<LoginForm />);

		await expect.element(screen.getByLabelText("Email")).toBeInTheDocument();
		await expect
			.element(screen.getByRole("link", { name: "Create an account" }))
			.not.toBeInTheDocument();
	});

	it("keeps OIDC provider buttons visible when email registration is disabled", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: false,
				},
				bootstrapAvailable: false,
				providers: [
					{
						id: "authentik",
						name: "Authentik",
						type: "oidc",
						allowAccountCreation: true,
					},
				],
			}),
		});

		const screen = await render(<LoginForm register />);

		await expect
			.element(screen.getByRole("button", { name: "Continue with Authentik" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Email/password registration is disabled"))
			.toBeInTheDocument();
	});

	it("shows OIDC errors when email registration controls are hidden", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				emailPassword: {
					signInEnabled: true,
					registrationEnabled: false,
				},
				bootstrapAvailable: false,
				providers: [
					{
						id: "authentik",
						name: "Authentik",
						type: "oidc",
						allowAccountCreation: true,
					},
				],
			}),
		});
		mockSignInOauth2.mockRejectedValueOnce(new Error("OIDC unavailable"));

		const screen = await render(<LoginForm register />);

		await userEvent.click(
			screen.getByRole("button", { name: "Continue with Authentik" }),
		);

		await expect
			.element(screen.getByText("OIDC unavailable"))
			.toBeInTheDocument();
	});
});
