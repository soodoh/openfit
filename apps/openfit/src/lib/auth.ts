import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { schema } from "@/db/schema";
import {
	getOidcProviderConfig,
	getSocialProviderConfigs,
} from "@/lib/auth-config";

const authBaseURL =
	process.env.BETTER_AUTH_BASE_URL ??
	process.env.VITE_APP_URL ??
	(process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");

const socialProviders = getSocialProviderConfigs(process.env);
const oidcProviderConfig = getOidcProviderConfig(process.env);

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
		enabled: true,
	},
	socialProviders,
	plugins: oidcProviderConfig
		? [
				genericOAuth({
					config: [
						{
							providerId: "oidc",
							...oidcProviderConfig,
						},
					],
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
				after: (user) => {
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
							role: "USER",
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
