import { StrictMode, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { AuthProviderStatus } from "@/lib/auth-provider-status";
import { type LoginAdapter, useLoginFlow } from "./use-login-flow";

const status: AuthProviderStatus = {
	emailPassword: { signInEnabled: true, registrationEnabled: true },
	bootstrapAvailable: false,
	providers: [
		{ id: "google", name: "Google", type: "social", requestSignUp: false },
		{
			id: "company",
			name: "Company",
			type: "oidc",
			allowAccountCreation: true,
			requestSignUp: false,
		},
	],
};

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}

let adapter: LoginAdapter;
const navigate = vi.fn();

function Harness({ register = false }: { register?: boolean }) {
	const [email, setEmail] = useState("person@example.com");
	const [password, setPassword] = useState("Password1!");
	const flow = useLoginFlow({ register, onAuthenticated: navigate }, adapter);
	return (
		<div>
			<p>{flow.providerStatus.state}</p>
			<p>
				{flow.canRegisterWithEmail
					? "Registration available"
					: "Registration unavailable"}
			</p>
			<p>{flow.busy ? "Busy" : "Idle"}</p>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void flow.submitCredentials({ email, password });
				}}
			>
				<input
					aria-label="Email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
				/>
				<input
					aria-label="Password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
				/>
				<button type="submit" disabled={flow.busy}>
					Submit
				</button>
			</form>
			{flow.providers.map((provider) => (
				<button
					key={provider.id}
					type="button"
					disabled={flow.busy}
					onClick={() => {
						void flow.signInWithProvider(provider.id);
					}}
				>
					{provider.name}
				</button>
			))}
			<button type="button" onClick={flow.retryProviders}>
				Retry
			</button>
			<button
				type="button"
				onClick={() => {
					void flow.signInWithProvider("missing");
				}}
			>
				Unknown provider
			</button>
			{[flow.error, ...flow.emailErrors, ...flow.passwordErrors]
				.filter(Boolean)
				.map((error) => (
					<p key={error}>{error}</p>
				))}
		</div>
	);
}

describe("login-flow interface", () => {
	beforeEach(() => {
		navigate.mockReset();
		adapter = {
			loadProviders: vi.fn().mockResolvedValue(status),
			signInEmail: vi.fn().mockResolvedValue({ error: null }),
			signUpEmail: vi.fn().mockResolvedValue({ error: null }),
			signInProvider: vi.fn().mockResolvedValue({ error: null }),
			getSession: vi.fn().mockResolvedValue({
				data: { session: { id: "session" }, user: { id: "user" } },
			}),
		};
	});

	it("ignores the first aborted discovery during Strict Mode effect replay", async () => {
		const oldLoad = deferred<AuthProviderStatus>();
		vi.mocked(adapter.loadProviders)
			.mockReturnValueOnce(oldLoad.promise)
			.mockResolvedValueOnce({
				...status,
				emailPassword: { signInEnabled: true, registrationEnabled: false },
			});
		const screen = await render(
			<StrictMode>
				<Harness register />
			</StrictMode>,
		);
		await expect
			.element(screen.getByText("ready", { exact: true }))
			.toBeInTheDocument();
		expect(vi.mocked(adapter.loadProviders).mock.calls[0][0].aborted).toBe(
			true,
		);
		oldLoad.resolve(status);
		await expect
			.element(screen.getByText("Registration unavailable"))
			.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Submit" }));
		expect(adapter.signUpEmail).not.toHaveBeenCalled();
	});

	it("starts fail-closed while provider status loads", async () => {
		const pending = deferred<AuthProviderStatus>();
		vi.mocked(adapter.loadProviders).mockReturnValue(pending.promise);
		const screen = await render(<Harness register />);
		await expect
			.element(screen.getByText("loading", { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Registration unavailable"))
			.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Submit" }));
		expect(adapter.signUpEmail).not.toHaveBeenCalled();
		pending.resolve(status);
		await expect
			.element(screen.getByText("Registration available"))
			.toBeInTheDocument();
	});

	it.each(["email", "provider"])(
		"revokes provider capabilities before a retry re-renders (%s)",
		async (mode) => {
			const pending = deferred<AuthProviderStatus>();
			vi.mocked(adapter.loadProviders)
				.mockResolvedValueOnce(status)
				.mockReturnValueOnce(pending.promise);
			const screen = await render(<Harness register />);
			await expect
				.element(screen.getByText("Registration available"))
				.toBeInTheDocument();
			const buttons = Array.from(screen.container.querySelectorAll("button"));
			buttons.find((button) => button.textContent === "Retry")?.click();
			if (mode === "email") {
				screen.container
					.querySelector("form")
					?.dispatchEvent(
						new Event("submit", { bubbles: true, cancelable: true }),
					);
			} else {
				buttons.find((button) => button.textContent === "Company")?.click();
			}
			expect(adapter.signUpEmail).not.toHaveBeenCalled();
			expect(adapter.signInProvider).not.toHaveBeenCalled();
		},
	);

	it("clears stale permissions immediately on retry and ignores an aborted load", async () => {
		const pending = deferred<AuthProviderStatus>();
		vi.mocked(adapter.loadProviders)
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValueOnce({
				...status,
				emailPassword: { signInEnabled: true, registrationEnabled: false },
				providers: [],
			});
		const screen = await render(<Harness register />);
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		await expect
			.element(screen.getByText("ready", { exact: true }))
			.toBeInTheDocument();
		expect(vi.mocked(adapter.loadProviders).mock.calls[0][0].aborted).toBe(
			true,
		);
		pending.resolve(status);
		await expect
			.element(screen.getByText("Registration unavailable"))
			.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Submit" }));
		expect(adapter.signUpEmail).not.toHaveBeenCalled();
	});

	it("recovers from unavailable status without enabling registration prematurely", async () => {
		vi.mocked(adapter.loadProviders).mockRejectedValueOnce(
			new Error("offline"),
		);
		const pending = deferred<AuthProviderStatus>();
		vi.mocked(adapter.loadProviders).mockReturnValueOnce(pending.promise);
		const screen = await render(<Harness register />);
		await expect
			.element(screen.getByText("error", { exact: true }))
			.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		await expect
			.element(screen.getByText("loading", { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Registration unavailable"))
			.toBeInTheDocument();
		pending.resolve(status);
		await expect
			.element(screen.getByText("Registration available"))
			.toBeInTheDocument();
	});

	it.each([false, true])(
		"waits for a usable session before completing email flow (register=%s)",
		async (register) => {
			const pending = deferred<{ data: unknown }>();
			vi.mocked(adapter.getSession).mockReturnValue(pending.promise);
			const screen = await render(<Harness register={register} />);
			await expect
				.element(screen.getByText("Registration available"))
				.toBeInTheDocument();
			await userEvent.click(screen.getByRole("button", { name: "Submit" }));
			await vi.waitFor(() =>
				expect(adapter.getSession).toHaveBeenCalledTimes(1),
			);
			expect(navigate).not.toHaveBeenCalled();
			if (register)
				expect(adapter.signUpEmail).toHaveBeenCalledWith({
					email: "person@example.com",
					password: "Password1!",
					name: "person",
				});
			else
				expect(adapter.signInEmail).toHaveBeenCalledWith({
					email: "person@example.com",
					password: "Password1!",
				});
			pending.resolve({ data: { session: { id: "session" } } });
			await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
			await expect.element(screen.getByText("Busy")).toBeInTheDocument();
		},
	);

	it("keeps email sign-in available when provider status fails", async () => {
		vi.mocked(adapter.loadProviders).mockRejectedValueOnce(
			new Error("offline"),
		);
		const screen = await render(<Harness />);
		await expect
			.element(screen.getByText("error", { exact: true }))
			.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Submit" }));
		await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
	});

	it("keeps validation in the flow and does not call auth for invalid fields", async () => {
		const screen = await render(<Harness />);
		await screen.getByLabelText("Email").fill("bad-email");
		await screen.getByLabelText("Password").fill("short");
		await userEvent.click(screen.getByRole("button", { name: "Submit" }));
		await expect.element(screen.getByText("Invalid email")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Be at least 8 characters long"))
			.toBeInTheDocument();
		expect(adapter.signInEmail).not.toHaveBeenCalled();
		expect(adapter.getSession).not.toHaveBeenCalled();
	});

	it.each([false, true])(
		"shows returned email errors and unlocks retry (register=%s)",
		async (register) => {
			const signIn = register ? adapter.signUpEmail : adapter.signInEmail;
			vi.mocked(signIn).mockResolvedValueOnce({ error: { message: "denied" } });
			const screen = await render(<Harness register={register} />);
			await expect
				.element(screen.getByText("Registration available"))
				.toBeInTheDocument();
			await userEvent.click(screen.getByRole("button", { name: "Submit" }));
			await expect.element(screen.getByText("denied")).toBeInTheDocument();
			await expect.element(screen.getByText("Idle")).toBeInTheDocument();
			expect(adapter.getSession).not.toHaveBeenCalled();
			await userEvent.click(screen.getByRole("button", { name: "Submit" }));
			await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
		},
	);

	it.each([
		{ data: null },
		{ data: { session: {} }, error: { message: "unavailable" } },
	])(
		"does not complete with a missing or errored session (%j)",
		async (session) => {
			vi.mocked(adapter.getSession).mockResolvedValueOnce(session);
			const screen = await render(<Harness />);
			await userEvent.click(screen.getByRole("button", { name: "Submit" }));
			await expect
				.element(
					screen.getByText(
						"Authentication succeeded but session was not ready",
					),
				)
				.toBeInTheDocument();
			expect(navigate).not.toHaveBeenCalled();
			await expect.element(screen.getByText("Idle")).toBeInTheDocument();
		},
	);

	it.each([new Error("network unavailable"), "unexpected rejection"])(
		"normalizes thrown credential errors (%j)",
		async (error) => {
			vi.mocked(adapter.signInEmail).mockRejectedValueOnce(error);
			const screen = await render(<Harness />);
			await userEvent.click(screen.getByRole("button", { name: "Submit" }));
			await expect
				.element(
					screen.getByText(
						error instanceof Error ? error.message : "Authentication failed",
					),
				)
				.toBeInTheDocument();
			expect(navigate).not.toHaveBeenCalled();
			await expect.element(screen.getByText("Idle")).toBeInTheDocument();
		},
	);

	it.each(["google", "company"])(
		"uses the provider's supplied bootstrap instruction, not its type (%s)",
		async (provider) => {
			vi.mocked(adapter.loadProviders).mockResolvedValueOnce({
				...status,
				bootstrapAvailable: true,
				providers: status.providers.map((item) => ({
					...item,
					requestSignUp: true,
				})),
			});
			const screen = await render(<Harness />);
			await userEvent.click(
				screen.getByRole("button", {
					name: provider === "google" ? "Google" : "Company",
					exact: true,
				}),
			);
			expect(adapter.signInProvider).toHaveBeenCalledWith({
				provider,
				callbackURL: "/",
				requestSignUp: true,
			});
			expect(adapter.getSession).not.toHaveBeenCalled();
			expect(navigate).not.toHaveBeenCalled();
			await expect.element(screen.getByText("Busy")).toBeInTheDocument();
		},
	);

	it("shows returned OAuth errors and permits a subsequent attempt", async () => {
		vi.mocked(adapter.signInProvider).mockResolvedValueOnce({
			error: { message: "Provider denied sign-in" },
		});
		const screen = await render(<Harness />);
		await userEvent.click(
			screen.getByRole("button", { name: "Company", exact: true }),
		);
		await expect
			.element(screen.getByText("Provider denied sign-in"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Idle")).toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: "Company", exact: true }),
		);
		expect(adapter.signInProvider).toHaveBeenCalledTimes(2);
		expect(adapter.signInProvider).toHaveBeenLastCalledWith({
			provider: "company",
			callbackURL: "/",
		});
		await expect.element(screen.getByText("Busy")).toBeInTheDocument();
	});

	it.each([new Error("OAuth offline"), "unexpected rejection"])(
		"normalizes thrown OAuth failures (%j)",
		async (error) => {
			vi.mocked(adapter.signInProvider).mockRejectedValueOnce(error);
			const screen = await render(<Harness />);
			await userEvent.click(
				screen.getByRole("button", { name: "Google", exact: true }),
			);
			await expect
				.element(
					screen.getByText(
						error instanceof Error ? error.message : "OAuth sign-in failed",
					),
				)
				.toBeInTheDocument();
			await expect.element(screen.getByText("Idle")).toBeInTheDocument();
		},
	);

	it("rejects unavailable provider initiation without calling transport", async () => {
		const screen = await render(<Harness />);
		await userEvent.click(
			screen.getByRole("button", { name: "Unknown provider" }),
		);
		await expect
			.element(screen.getByText("This sign-in option is currently unavailable"))
			.toBeInTheDocument();
		expect(adapter.signInProvider).not.toHaveBeenCalled();
	});

	it("excludes overlapping attempts even before a render updates the buttons", async () => {
		const pending = deferred<{ error: null }>();
		vi.mocked(adapter.signInEmail).mockReturnValue(pending.promise);
		const screen = await render(<Harness />);
		const form = screen.container.querySelector("form");
		form?.dispatchEvent(
			new Event("submit", { bubbles: true, cancelable: true }),
		);
		form?.dispatchEvent(
			new Event("submit", { bubbles: true, cancelable: true }),
		);
		await vi.waitFor(() =>
			expect(adapter.signInEmail).toHaveBeenCalledTimes(1),
		);
		await expect
			.element(screen.getByRole("button", { name: "Company", exact: true }))
			.toBeDisabled();
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(adapter.loadProviders).toHaveBeenCalledTimes(1);
		pending.resolve({ error: null });
		await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
	});

	it("cancels discovery and does not navigate from an unmounted attempt", async () => {
		const pending = deferred<{ error: null }>();
		vi.mocked(adapter.signInEmail).mockReturnValue(pending.promise);
		const screen = await render(<Harness />);
		await userEvent.click(screen.getByRole("button", { name: "Submit" }));
		await screen.unmount();
		expect(vi.mocked(adapter.loadProviders).mock.calls[0][0].aborted).toBe(
			true,
		);
		pending.resolve({ error: null });
		await pending.promise;
		expect(adapter.getSession).not.toHaveBeenCalled();
		expect(navigate).not.toHaveBeenCalled();
	});
});
