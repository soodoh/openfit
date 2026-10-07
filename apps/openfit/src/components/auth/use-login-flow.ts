import { useEffect, useRef, useState } from "react";
import { flattenError } from "zod";
import { getSession, signIn, signUp } from "@/lib/auth-client";
import {
	type AuthProviderStatus,
	AuthProviderStatusSchema,
} from "@/lib/auth-provider-status";
import { SignUpSchema } from "@/lib/auth-schema";

type Credentials = { email: string; password: string };
type AuthResult = { error?: { message?: string } | null };

export type LoginAdapter = {
	loadProviders: (signal: AbortSignal) => Promise<AuthProviderStatus>;
	signInEmail: (credentials: Credentials) => Promise<AuthResult>;
	signUpEmail: (
		credentials: Credentials & { name: string },
	) => Promise<AuthResult>;
	signInProvider: (options: {
		provider: string;
		callbackURL: string;
		requestSignUp?: boolean;
	}) => Promise<AuthResult>;
	getSession: () => Promise<AuthResult & { data: unknown }>;
};

const browserAdapter: LoginAdapter = {
	async loadProviders(signal) {
		const response = await fetch("/api/auth/providers", { signal });
		if (!response.ok) throw new Error("Provider status is unavailable");
		return AuthProviderStatusSchema.parse(await response.json());
	},
	signInEmail: (credentials) => signIn.email(credentials),
	signUpEmail: (credentials) => signUp.email(credentials),
	signInProvider: (options) => signIn.social(options),
	getSession,
};

type ProviderStatus =
	| { state: "loading" }
	| { state: "ready"; data: AuthProviderStatus }
	| { state: "error"; message: string };

type Attempt = {
	pending: { type: "email" } | { type: "provider"; id: string } | null;
	error?: string;
	emailErrors: string[];
	passwordErrors: string[];
};

const idleAttempt: Attempt = {
	pending: null,
	emailErrors: [],
	passwordErrors: [],
};

/** The form supplies input; this module owns discovery, permission, and attempt ordering. */
export function useLoginFlow(
	{
		register = false,
		onAuthenticated,
	}: { register?: boolean; onAuthenticated: () => void | Promise<void> },
	adapter: LoginAdapter = browserAdapter,
) {
	const [providerStatus, setProviderStatus] = useState<ProviderStatus>({
		state: "loading",
	});
	const [reload, setReload] = useState(0);
	const [attempt, setAttempt] = useState<Attempt>(idleAttempt);
	const running = useRef(false);
	const mounted = useRef(false);
	const providerRequest = useRef<AbortController | null>(null);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload explicitly triggers user-requested revalidation.
	useEffect(() => {
		const controller = new AbortController();
		providerRequest.current = controller;
		setProviderStatus({ state: "loading" });
		void adapter.loadProviders(controller.signal).then(
			(data) => {
				if (!controller.signal.aborted)
					setProviderStatus({ state: "ready", data });
			},
			() => {
				if (!controller.signal.aborted)
					setProviderStatus({
						state: "error",
						message: "Could not load sign-in options. Please try again.",
					});
			},
		);
		return () => controller.abort();
	}, [adapter, reload]);

	function updateAttempt(next: Attempt) {
		if (mounted.current) setAttempt(next);
	}

	function fail(next: Omit<Attempt, "pending">) {
		running.current = false;
		updateAttempt({ pending: null, ...next });
	}

	const canRegisterWithEmail =
		providerStatus.state === "ready" &&
		providerStatus.data.emailPassword.registrationEnabled;

	return {
		providerStatus,
		providers:
			providerStatus.state === "ready" ? providerStatus.data.providers : [],
		canRegisterWithEmail,
		busy: attempt.pending !== null,
		emailLoading: attempt.pending?.type === "email",
		oauthLoading:
			attempt.pending?.type === "provider" ? attempt.pending.id : undefined,
		error: attempt.error,
		emailErrors: attempt.emailErrors,
		passwordErrors: attempt.passwordErrors,
		retryProviders() {
			if (running.current) return;
			// Revoke the old load synchronously, before the next effect can run.
			providerRequest.current?.abort();
			setProviderStatus({ state: "loading" });
			setReload((value) => value + 1);
		},
		async submitCredentials(credentials: Credentials) {
			if (running.current) return;
			// Retry revocation is immediate, even before React commits its loading state.
			if (
				register &&
				(!canRegisterWithEmail || providerRequest.current?.signal.aborted)
			) {
				fail({
					...idleAttempt,
					error: "Registration is currently unavailable",
				});
				return;
			}
			const validation = SignUpSchema.safeParse(credentials);
			if (!validation.success) {
				const errors = flattenError(validation.error);
				fail({
					emailErrors: errors.fieldErrors.email ?? [],
					passwordErrors: errors.fieldErrors.password ?? [],
				});
				return;
			}
			running.current = true;
			updateAttempt({ ...idleAttempt, pending: { type: "email" } });
			try {
				const result = register
					? await adapter.signUpEmail({
							...credentials,
							name: credentials.email.split("@")[0],
						})
					: await adapter.signInEmail(credentials);
				if (!mounted.current) return;
				if (result.error) {
					fail({
						emailErrors: [],
						passwordErrors: [
							result.error.message ??
								(register ? "Registration failed" : "Authentication failed"),
						],
					});
					return;
				}
				const session = await adapter.getSession();
				if (!mounted.current) return;
				if (session.error || !session.data) {
					fail({
						emailErrors: [],
						passwordErrors: [
							"Authentication succeeded but session was not ready",
						],
					});
					return;
				}
				// Keep the attempt locked while leaving the page; getSession is a readiness check,
				// not a synchronous update of Better Auth's separate useSession cache.
				await onAuthenticated();
			} catch (error) {
				fail({
					...idleAttempt,
					error:
						error instanceof Error ? error.message : "Authentication failed",
				});
			}
		},
		async signInWithProvider(providerId: string) {
			if (running.current) return;
			const provider =
				providerStatus.state === "ready" &&
				!providerRequest.current?.signal.aborted
					? providerStatus.data.providers.find((item) => item.id === providerId)
					: undefined;
			if (!provider) {
				fail({
					...idleAttempt,
					error: "This sign-in option is currently unavailable",
				});
				return;
			}
			running.current = true;
			updateAttempt({
				...idleAttempt,
				pending: { type: "provider", id: provider.id },
			});
			try {
				const result = await adapter.signInProvider({
					provider: provider.id,
					callbackURL: "/",
					...(provider.requestSignUp ? { requestSignUp: true } : {}),
				});
				if (result.error) {
					fail({
						...idleAttempt,
						error: result.error.message ?? "OAuth sign-in failed",
					});
				}
				// The real adapter starts the browser redirect on success.
			} catch (error) {
				fail({
					...idleAttempt,
					error:
						error instanceof Error ? error.message : "OAuth sign-in failed",
				});
			}
		},
	};
}
