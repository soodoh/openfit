import { type AuthConfig, getAuthConfig } from "@/lib/auth-config";
import type { AuthProviderStatus } from "@/lib/auth-provider-status";

export type RegistrationDenial = { message: string };

type Origin =
	| { type: "email" }
	| { type: "provider"; id: unknown }
	| { type: "unknown" };

function record(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

const socialProviderNames = {
	google: "Google",
	github: "GitHub",
	discord: "Discord",
};
const unknownOrigin = { message: "Account creation origin is not recognized" };

/** Owns eligibility, provider classification, and public status; never caches user state. */
export function createRegistrationPolicy(
	configuration: AuthConfig,
	loadBootstrapAvailable: () => Promise<boolean>,
) {
	const config = structuredClone(configuration);
	const oidcProviders = new Map<
		string,
		(typeof config.oidcProviders)[number]
	>();
	for (const provider of config.oidcProviders) {
		// Better Auth dispatches the first configured match, not the last one.
		if (!oidcProviders.has(provider.providerId)) {
			oidcProviders.set(provider.providerId, provider);
		}
	}
	const emailRegistrationEnabled =
		!config.registration.disableAll &&
		!config.registration.disableEmailPassword;

	async function decide(origin: Origin): Promise<RegistrationDenial | null> {
		if (origin.type === "unknown") return unknownOrigin;
		if (origin.type === "email") {
			return emailRegistrationEnabled || (await loadBootstrapAvailable())
				? null
				: { message: "Email/password registration is disabled" };
		}
		if (typeof origin.id !== "string") return unknownOrigin;
		const oidc = oidcProviders.get(origin.id);
		if (oidc) {
			return oidc.allowAccountCreation || (await loadBootstrapAvailable())
				? null
				: { message: "Account creation is disabled for this OIDC provider" };
		}
		if (!Object.hasOwn(config.socialProviders, origin.id)) return unknownOrigin;
		return !config.registration.disableAll || (await loadBootstrapAvailable())
			? null
			: { message: "Account creation is disabled for this provider" };
	}

	return {
		async checkRequest(request: Request): Promise<RegistrationDenial | null> {
			if (request.method !== "POST") return null;
			const path = new URL(request.url).pathname;
			if (path === "/api/auth/sign-up/email") return decide({ type: "email" });
			if (path !== "/api/auth/sign-in/social") return null;
			let body: Record<string, unknown>;
			try {
				body = record(await request.clone().json());
			} catch {
				// Better Auth owns malformed sign-in input; creation still has its own check.
				return null;
			}
			return body.requestSignUp === true
				? decide({ type: "provider", id: body.provider })
				: null;
		},
		async checkUserCreation(
			context: unknown,
		): Promise<RegistrationDenial | null> {
			const { path, body, params } = record(context);
			if (path === "/sign-up/email") return decide({ type: "email" });
			if (path === "/sign-in/social")
				return decide({ type: "provider", id: record(body).provider });
			if (path === "/callback/:id")
				return decide({ type: "provider", id: record(params).id });
			return decide({ type: "unknown" });
		},
		async getProviderStatus(): Promise<AuthProviderStatus> {
			const bootstrapAvailable = await loadBootstrapAvailable();
			return {
				emailPassword: {
					signInEnabled: config.emailPassword.enabled,
					registrationEnabled: emailRegistrationEnabled || bootstrapAvailable,
				},
				bootstrapAvailable,
				providers: [
					...Object.keys(config.socialProviders)
						.filter((id) => !oidcProviders.has(id))
						.map((id) => ({
							id,
							name: socialProviderNames[id as keyof typeof socialProviderNames],
							type: "social" as const,
							requestSignUp: bootstrapAvailable,
						})),
					...[...oidcProviders.values()].map((provider) => ({
						id: provider.providerId,
						name: provider.displayName,
						type: "oidc" as const,
						allowAccountCreation: provider.allowAccountCreation,
						requestSignUp: bootstrapAvailable,
					})),
				],
			};
		},
	};
}

// Startup configuration is shared by Better Auth, both checks, and provider status.
export const authConfig = getAuthConfig(process.env);
export const registrationPolicy = createRegistrationPolicy(
	authConfig,
	async () => {
		const { db } = await import("@/db");
		return !(await db.query.users.findFirst());
	},
);
