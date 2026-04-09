import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const mockNavigate = vi.fn();
const mockSignInEmail = vi.fn();
const mockSignInSocial = vi.fn();
const mockSignInOauth2 = vi.fn();
const mockSignUpEmail = vi.fn();
const mockUseAuth = vi.fn();
const mockGetSession = vi.fn();

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
		vi.unstubAllEnvs();
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
		mockSignInEmail.mockResolvedValue({ error: null });
		mockSignInSocial.mockResolvedValue({ error: null });
		mockSignInOauth2.mockResolvedValue({ error: null });
		mockSignUpEmail.mockResolvedValue({ error: null });
		mockGetSession.mockResolvedValue({
			data: { session: { id: "session-1" } },
		});
	});

	it("redirects to home when already authenticated", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

		render(<LoginForm />);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/", replace: true });
		});
	});

	it("refreshes session and redirects after email login", async () => {
		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "person@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "Password1!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Login" }));

		await waitFor(() => {
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

		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "person@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "Password1!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Login" }));

		await waitFor(() => {
			expect(
				screen.getByText("Authentication succeeded but session was not ready"),
			).toBeInTheDocument();
		});
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("shows validation errors and blocks submission when the form is invalid", async () => {
		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "invalid" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "abc" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Login" }).closest("form"),
		);

		await waitFor(() => {
			expect(mockSignInEmail).not.toHaveBeenCalled();
		});
		expect(screen.getByText("Invalid email")).toBeInTheDocument();
		expect(
			screen.getByText("Be at least 8 characters long"),
		).toBeInTheDocument();
		expect(mockSignInEmail).not.toHaveBeenCalled();
		expect(mockGetSession).not.toHaveBeenCalled();
	});

	it("shows sign-in API errors and does not refresh session", async () => {
		mockSignInEmail.mockResolvedValue({
			error: { message: "Invalid email or password" },
		});

		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "person@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "Password1!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Login" }));

		await waitFor(() => {
			expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
		});
		expect(mockGetSession).not.toHaveBeenCalled();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("registers a new account when register mode is enabled", async () => {
		render(<LoginForm register />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "newperson@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "Password1!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Register" }));

		await waitFor(() => {
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

		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "person@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "Password1!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Login" }));

		expect(
			await screen.findByText("Authentication failed"),
		).toBeInTheDocument();
		expect(mockGetSession).not.toHaveBeenCalled();
	});

	it("shows registration errors when sign-up fails", async () => {
		mockSignUpEmail.mockResolvedValueOnce({
			error: { message: "Registration failed" },
		});

		render(<LoginForm register />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "newperson@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "Password1!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Register" }));

		expect(await screen.findByText("Registration failed")).toBeInTheDocument();
		expect(mockGetSession).not.toHaveBeenCalled();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("starts social OAuth sign-in when Google is enabled", async () => {
		vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "true");
		vi.resetModules();

		const { LoginForm: OAuthLoginForm } = await import("./login-form");

		render(<OAuthLoginForm />);

		fireEvent.click(
			screen.getByRole("button", { name: "Continue with Google" }),
		);

		expect(mockSignInSocial).toHaveBeenCalledWith({
			provider: "google",
			callbackURL: "/",
		});
	});

	it("shows a social OAuth error when the provider flow throws", async () => {
		vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "true");
		mockSignInSocial.mockRejectedValueOnce(new Error("oauth failed"));
		vi.resetModules();

		const { LoginForm: OAuthLoginForm } = await import("./login-form");

		render(<OAuthLoginForm />);

		fireEvent.click(
			screen.getByRole("button", { name: "Continue with Google" }),
		);

		expect(await screen.findByText("oauth failed")).toBeInTheDocument();
	});

	it("starts OIDC OAuth sign-in when the provider is enabled", async () => {
		vi.stubEnv("VITE_AUTH_OIDC_ENABLED", "true");
		vi.stubEnv("VITE_AUTH_OIDC_PROVIDER_NAME", "Acme SSO");
		vi.resetModules();

		const { LoginForm: OAuthLoginForm } = await import("./login-form");

		render(<OAuthLoginForm />);

		fireEvent.click(
			screen.getByRole("button", { name: "Continue with Acme SSO" }),
		);

		expect(mockSignInOauth2).toHaveBeenCalledWith({
			providerId: "oidc",
			callbackURL: "/",
		});
	});
});
