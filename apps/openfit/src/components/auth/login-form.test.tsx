import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { AuthProviderStatus } from "@/lib/auth-provider-status";
import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	signIn: vi.fn(),
	signUp: vi.fn(),
	provider: vi.fn(),
	getSession: vi.fn(),
	useAuth: vi.fn(),
	fetch: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useNavigate: () => mocks.navigate,
}));
vi.mock("@/components/providers/auth-provider", () => ({
	useAuth: () => mocks.useAuth(),
}));
vi.mock("@/lib/auth-client", () => ({
	signIn: { email: mocks.signIn, social: mocks.provider },
	signUp: { email: mocks.signUp },
	getSession: mocks.getSession,
}));

const openStatus: AuthProviderStatus = {
	emailPassword: { signInEnabled: true, registrationEnabled: true },
	bootstrapAvailable: false,
	providers: [],
};
const closedStatus: AuthProviderStatus = {
	...openStatus,
	emailPassword: { signInEnabled: true, registrationEnabled: false },
};

describe("login presentation with the real login-flow module", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", mocks.fetch);
		mocks.fetch.mockResolvedValue(Response.json(openStatus));
		mocks.useAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
		mocks.signIn.mockResolvedValue({ error: null });
		mocks.signUp.mockResolvedValue({ error: null });
		mocks.provider.mockResolvedValue({ error: null });
		mocks.getSession.mockResolvedValue({
			data: { session: { id: "session" }, user: { id: "user" } },
		});
	});
	afterEach(() => vi.unstubAllGlobals());

	it("redirects an already authenticated user", async () => {
		mocks.useAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		await render(<LoginForm />);
		await vi.waitFor(() =>
			expect(mocks.navigate).toHaveBeenCalledWith({ to: "/", replace: true }),
		);
	});

	it("renders email login and completes through the flow", async () => {
		const screen = await render(<LoginForm />);
		await screen.getByLabelText("Email").fill("person@example.com");
		await screen.getByLabelText("Password").fill("Password1!");
		await userEvent.click(
			screen.getByRole("button", { name: "Login", exact: true }),
		);
		await vi.waitFor(() =>
			expect(mocks.navigate).toHaveBeenCalledWith({ to: "/", replace: true }),
		);
		expect(mocks.signIn).toHaveBeenCalledWith({
			email: "person@example.com",
			password: "Password1!",
		});
	});

	it("renders registration when the server grants it", async () => {
		const screen = await render(<LoginForm register />);
		await screen.getByLabelText("Email").fill("new@example.com");
		await screen.getByLabelText("Password").fill("Password1!");
		await userEvent.click(
			screen.getByRole("button", { name: "Register", exact: true }),
		);
		await vi.waitFor(() =>
			expect(mocks.signUp).toHaveBeenCalledWith({
				email: "new@example.com",
				password: "Password1!",
				name: "new",
			}),
		);
	});

	it("distinguishes loading from disabled registration", async () => {
		mocks.fetch.mockReturnValue(new Promise<Response>(() => {}));
		const screen = await render(<LoginForm register />);
		await expect
			.element(screen.getByRole("status"))
			.toHaveTextContent("Loading sign-in options...");
		await expect
			.element(screen.getByText("Email/password registration is disabled"))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Register", exact: true }))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByLabelText("Email"))
			.not.toBeInTheDocument();
	});

	it.each([false, true])(
		"keeps email registration closed after discovery failure and offers retry (register=%s)",
		async (register) => {
			mocks.fetch
				.mockResolvedValueOnce(new Response(null, { status: 503 }))
				.mockResolvedValueOnce(Response.json(openStatus));
			const screen = await render(<LoginForm register={register} />);
			await expect
				.element(
					screen.getByText("Could not load sign-in options. Please try again."),
				)
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole("link", { name: "Create an account" }))
				.not.toBeInTheDocument();
			if (register)
				await expect
					.element(screen.getByLabelText("Email"))
					.not.toBeInTheDocument();
			else
				await expect
					.element(screen.getByLabelText("Email"))
					.toBeInTheDocument();
			await userEvent.click(
				screen.getByRole("button", { name: "Retry sign-in options" }),
			);
			if (register)
				await expect
					.element(
						screen.getByRole("button", { name: "Register", exact: true }),
					)
					.toBeInTheDocument();
			else
				await expect
					.element(screen.getByRole("link", { name: "Create an account" }))
					.toBeInTheDocument();
			expect(mocks.fetch).toHaveBeenCalledTimes(2);
		},
	);

	it.each([
		{},
		{
			...openStatus,
			bootstrapAvailable: true,
			emailPassword: { signInEnabled: true, registrationEnabled: false },
		},
	])(
		"treats invalid provider status as unavailable, not permission (%j)",
		async (payload) => {
			mocks.fetch.mockResolvedValueOnce(Response.json(payload));
			const screen = await render(<LoginForm register />);
			await expect
				.element(screen.getByRole("button", { name: "Retry sign-in options" }))
				.toBeInTheDocument();
			await expect
				.element(screen.getByRole("button", { name: "Register", exact: true }))
				.not.toBeInTheDocument();
		},
	);

	it("shows disabled registration only after valid closed status arrives", async () => {
		mocks.fetch.mockResolvedValueOnce(Response.json(closedStatus));
		const screen = await render(<LoginForm register />);
		await expect
			.element(screen.getByText("Email/password registration is disabled"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Retry sign-in options" }))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByRole("link", { name: "Back to sign in" }))
			.toBeInTheDocument();
	});

	it("keeps OIDC visible with email registration closed and displays returned OAuth errors", async () => {
		mocks.fetch.mockResolvedValueOnce(
			Response.json({
				...closedStatus,
				providers: [
					{
						id: "company",
						name: "Company",
						type: "oidc",
						allowAccountCreation: true,
						requestSignUp: false,
					},
				],
			}),
		);
		mocks.provider.mockResolvedValueOnce({
			error: { message: "OIDC unavailable" },
		});
		const screen = await render(<LoginForm register />);
		await userEvent.click(
			screen.getByRole("button", { name: "Continue with Company" }),
		);
		await expect
			.element(screen.getByRole("alert"))
			.toHaveTextContent("OIDC unavailable");
		await expect
			.element(screen.getByRole("button", { name: "Continue with Company" }))
			.toBeEnabled();
		expect(mocks.provider).toHaveBeenCalledWith({
			provider: "company",
			callbackURL: "/",
		});
	});

	it("renders field validation from the flow", async () => {
		const screen = await render(<LoginForm />);
		await screen.getByLabelText("Email").fill("invalid");
		await screen.getByLabelText("Password").fill("abc");
		await userEvent.click(
			screen.getByRole("button", { name: "Login", exact: true }),
		);
		await expect.element(screen.getByText("Invalid email")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Be at least 8 characters long"))
			.toBeInTheDocument();
		expect(mocks.signIn).not.toHaveBeenCalled();
	});
});
