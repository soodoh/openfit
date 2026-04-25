import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { getAuthConfig } from "@/lib/auth-config";
import {
	canRequestOidcAccountCreation,
	canRequestSocialAccountCreation,
	isEmailPasswordRegistrationAllowed,
} from "@/lib/auth-policy";

const authBaseURL =
	process.env.BETTER_AUTH_BASE_URL ??
	process.env.VITE_APP_URL ??
	(process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");

const authConfig = getAuthConfig(process.env);

type AuthEndpointContext = {
	path: string;
	params?: Record<string, string | undefined>;
};

function isAuthEndpointContext(
	context: unknown,
): context is AuthEndpointContext {
	return (
		!!context &&
		typeof context === "object" &&
		"path" in context &&
		typeof context.path === "string"
	);
}

function registrationDisabledError(message: string): APIError {
	return APIError.fromStatus("FORBIDDEN", { message });
}

async function assertUserCreationAllowed(context: unknown): Promise<void> {
	if (!isAuthEndpointContext(context)) {
		return;
	}

	if (context.path === "/sign-up/email") {
		if (!(await isEmailPasswordRegistrationAllowed(authConfig))) {
			throw registrationDisabledError(
				"Email/password registration is disabled",
			);
		}
		return;
	}

	if (context.path.startsWith("/callback")) {
		if (!(await canRequestSocialAccountCreation(authConfig))) {
			throw registrationDisabledError(
				"Account creation is disabled for this provider",
			);
		}
		return;
	}

	if (context.path.startsWith("/oauth2/callback")) {
		const providerId = context.params?.providerId;
		if (
			!providerId ||
			!(await canRequestOidcAccountCreation(authConfig, providerId))
		) {
			throw registrationDisabledError(
				"Account creation is disabled for this OIDC provider",
			);
		}
	}
}

export const auth = betterAuth({
	...(authBaseURL ? { baseURL: authBaseURL } : {}),
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	emailAndPassword: {
		enabled: authConfig.emailPassword.enabled,
	},
	socialProviders: authConfig.socialProviders,
	plugins:
		authConfig.oidcProviders.length > 0
			? [
					genericOAuth({
						config: authConfig.oidcProviders.map((provider) => ({
							providerId: provider.providerId,
							clientId: provider.clientId,
							clientSecret: provider.clientSecret,
							discoveryUrl: provider.discoveryUrl,
							issuer: provider.issuer,
							scopes: provider.scopes,
							pkce: provider.pkce,
							disableImplicitSignUp: !provider.allowAccountCreation,
						})),
					}),
				]
			: [],
	user: {
		additionalFields: {},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	callbacks: {
		session: ({
			session,
			user,
		}: {
			session: { user: Record<string, unknown>; [key: string]: unknown };
			user: { id: string };
		}) => {
			return {
				...session,
				user: {
					...session.user,
					id: user.id,
				},
			};
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (_user, context) => {
					await assertUserCreationAllowed(context);
				},
				after: async (user) => {
					const otherUser = await db.query.users.findFirst({
						where: ne(schema.users.id, user.id),
					});
					const repUnits = db
						.select()
						.from(schema.repetitionUnits)
						.limit(1)
						.all();
					const weightUnits = db
						.select()
						.from(schema.weightUnits)
						.limit(1)
						.all();

					db.insert(schema.userProfiles)
						.values({
							id: nanoid(),
							userId: user.id,
							role: otherUser ? "USER" : "ADMIN",
							defaultRepetitionUnitId: repUnits[0]?.id ?? null,
							defaultWeightUnitId: weightUnits[0]?.id ?? null,
							theme: "system",
						})
						.run();
				},
			},
		},
	},
});

export type Session = typeof auth.$Infer.Session;
