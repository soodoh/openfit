# Env-Driven Auth Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make production Docker onboarding auth fully env-driven, with global/email registration gates, multiple indexed OIDC providers, per-OIDC account creation opt-in, and first-user admin bootstrap.

**Architecture:** Add a server-side auth config parser and policy helper, then wire Better Auth to that parsed config. The UI consumes `/api/auth/providers` instead of `import.meta.env`, and the admin auth provider table is removed because provider config is env-owned.

**Tech Stack:** Bun, TanStack Start, React, TypeScript, Better Auth, Drizzle SQLite, Vitest browser tests.

---

## File Structure

- `apps/openfit/src/lib/auth-config.ts`: parse env vars into a single auth config object, including indexed OIDC providers and registration flags.
- `apps/openfit/src/lib/auth-config.test.ts`: unit tests for env parsing and defaults.
- `apps/openfit/src/lib/auth-policy.ts`: server-side helpers that answer "is bootstrap available?", "is email signup allowed?", and "may this OIDC request ask Better Auth to create a new user?".
- `apps/openfit/src/lib/auth-policy.test.ts`: policy tests with mocked db queries.
- `apps/openfit/src/lib/auth.ts`: feed multiple OIDC providers into `genericOAuth`, set `disableImplicitSignUp` for OIDC providers that require explicit server approval, and create first-user admin profiles.
- `apps/openfit/src/lib/auth.test.ts`: update auth config capture tests for multiple OIDC providers and first-user admin profile creation.
- `apps/openfit/src/routes/api/auth.$.ts`: gate email signup and OIDC `requestSignUp` requests before delegating to Better Auth.
- `apps/openfit/src/routes/api/auth.$.test.ts`: route wrapper tests for blocked/allowed registration requests.
- `apps/openfit/src/routes/api/auth/providers.ts`: return non-secret auth surface for the client.
- `apps/openfit/src/routes/api/-auth-providers.test.ts`: provider status API tests.
- `apps/openfit/src/components/auth/login-form.tsx`: fetch provider status from `/api/auth/providers`, render OIDC buttons from the response, and remove direct `VITE_AUTH_*` usage.
- `apps/openfit/src/components/auth/login-form.test.tsx`: UI tests for provider-driven login/register states.
- `apps/openfit/src/routes/register.tsx`: keep route, but rely on `LoginForm register` for unavailable state.
- `apps/openfit/src/components/admin/admin-page.tsx`: remove the Auth tab.
- `apps/openfit/src/components/admin/auth-providers-table.tsx`: delete.
- `apps/openfit/src/components/admin/admin-page.test.tsx` and `apps/openfit/src/components/admin/admin-tables.test.tsx`: remove auth tab/table assertions.
- `apps/openfit/.env.example`: document `DISABLE_*` and `OIDC_N_*` env vars.
- `apps/openfit/README.md`: document Docker/self-hosted auth setup and callback URLs.

### Task 1: Auth Config Parser

**Files:**
- Modify: `apps/openfit/src/lib/auth-config.ts`
- Modify: `apps/openfit/src/lib/auth-config.test.ts`

- [ ] **Step 1: Write failing env parser tests**

Replace the current OIDC tests in `apps/openfit/src/lib/auth-config.test.ts` with tests that assert the new indexed contract while keeping the social provider tests.

```ts
import { describe, expect, it } from "vitest";
import {
	getAuthConfig,
	getSocialProviderConfigs,
} from "./auth-config";

describe("getSocialProviderConfigs", () => {
	it("returns only providers with complete credentials", () => {
		const providers = getSocialProviderConfigs({
			AUTH_GOOGLE_ID: "google-id",
			AUTH_GOOGLE_SECRET: "google-secret",
			AUTH_GITHUB_ID: "github-id",
			AUTH_GITHUB_SECRET: "",
			AUTH_DISCORD_ID: "discord-id",
			AUTH_DISCORD_SECRET: "discord-secret",
		});

		expect(providers).toEqual({
			google: {
				clientId: "google-id",
				clientSecret: "google-secret",
			},
			discord: {
				clientId: "discord-id",
				clientSecret: "discord-secret",
			},
		});
	});

	it("ignores blank credential values", () => {
		const providers = getSocialProviderConfigs({
			AUTH_GOOGLE_ID: "   ",
			AUTH_GOOGLE_SECRET: "secret",
		});

		expect(providers).toEqual({});
	});

	it("trims provider credentials before returning them", () => {
		const providers = getSocialProviderConfigs({
			AUTH_GOOGLE_ID: " google-id ",
			AUTH_GOOGLE_SECRET: " google-secret ",
			AUTH_GITHUB_ID: " github-id ",
			AUTH_GITHUB_SECRET: " github-secret ",
		});

		expect(providers).toEqual({
			google: {
				clientId: "google-id",
				clientSecret: "google-secret",
			},
			github: {
				clientId: "github-id",
				clientSecret: "github-secret",
			},
		});
	});
});

describe("getAuthConfig", () => {
	it("parses registration flags from explicit truthy values only", () => {
		expect(
			getAuthConfig({
				DISABLE_REGISTRATION: "true",
				DISABLE_EMAIL_PASSWORD_REGISTRATION: "1",
			}).registration,
		).toEqual({
			disableAll: true,
			disableEmailPassword: true,
		});

		expect(
			getAuthConfig({
				DISABLE_REGISTRATION: "yes",
				DISABLE_EMAIL_PASSWORD_REGISTRATION: "false",
			}).registration,
		).toEqual({
			disableAll: false,
			disableEmailPassword: false,
		});
	});

	it("parses multiple indexed OIDC providers", () => {
		const config = getAuthConfig({
			OIDC_1_PROVIDER_ID: "authentik",
			OIDC_1_PROVIDER_NAME: "Authentik",
			OIDC_1_CLIENT_ID: " client-one ",
			OIDC_1_CLIENT_SECRET: " secret-one ",
			OIDC_1_ISSUER: " https://auth.example.com ",
			OIDC_1_SCOPES: "openid,email,profile,groups",
			OIDC_1_ALLOW_ACCOUNT_CREATION: "true",
			OIDC_2_PROVIDER_ID: "authelia",
			OIDC_2_CLIENT_ID: "client-two",
			OIDC_2_CLIENT_SECRET: "secret-two",
			OIDC_2_ISSUER: "https://sso.example.com",
		});

		expect(config.oidcProviders).toEqual([
			{
				providerId: "authentik",
				displayName: "Authentik",
				clientId: "client-one",
				clientSecret: "secret-one",
				issuer: "https://auth.example.com",
				discoveryUrl: "https://auth.example.com/.well-known/openid-configuration",
				scopes: ["openid", "email", "profile", "groups"],
				pkce: true,
				allowAccountCreation: true,
			},
			{
				providerId: "authelia",
				displayName: "authelia",
				clientId: "client-two",
				clientSecret: "secret-two",
				issuer: "https://sso.example.com",
				discoveryUrl: "https://sso.example.com/.well-known/openid-configuration",
				scopes: ["openid", "email", "profile"],
				pkce: true,
				allowAccountCreation: false,
			},
		]);
	});

	it("fails partial OIDC providers closed", () => {
		const config = getAuthConfig({
			OIDC_1_PROVIDER_ID: "broken",
			OIDC_1_CLIENT_ID: "client",
			OIDC_1_CLIENT_SECRET: "secret",
			OIDC_2_PROVIDER_ID: "valid-after-partial",
			OIDC_2_CLIENT_ID: "client-two",
			OIDC_2_CLIENT_SECRET: "secret-two",
			OIDC_2_ISSUER: "https://sso.example.com",
		});

		expect(config.oidcProviders).toEqual([
			expect.objectContaining({
				providerId: "valid-after-partial",
				clientId: "client-two",
			}),
		]);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun --filter openfit test:run src/lib/auth-config.test.ts
```

Expected: FAIL because `getAuthConfig` is not exported and `getOidcProviderConfig` tests were removed.

- [ ] **Step 3: Implement auth config parser**

Update `apps/openfit/src/lib/auth-config.ts` to export `getAuthConfig` and keep `getSocialProviderConfigs`.

```ts
type EnvSource = Record<string, string | undefined>;

export type SocialProviderConfig = {
	clientId: string;
	clientSecret: string;
};

export type OidcProviderConfig = {
	providerId: string;
	displayName: string;
	clientId: string;
	clientSecret: string;
	issuer: string;
	discoveryUrl: string;
	scopes: string[];
	pkce: true;
	allowAccountCreation: boolean;
};

export type AuthConfig = {
	registration: {
		disableAll: boolean;
		disableEmailPassword: boolean;
	};
	emailPassword: {
		enabled: true;
	};
	socialProviders: Partial<
		Record<"google" | "github" | "discord", SocialProviderConfig>
	>;
	oidcProviders: OidcProviderConfig[];
};

function getRequiredEnvValue(value: string | undefined): string | null {
	const normalizedValue = value?.trim();
	return normalizedValue ? normalizedValue : null;
}

function getBooleanEnvValue(value: string | undefined): boolean {
	const normalizedValue = value?.trim().toLowerCase();
	return normalizedValue === "true" || normalizedValue === "1";
}

function getCredentialPair(
	clientId: string | undefined,
	clientSecret: string | undefined,
): SocialProviderConfig | null {
	const normalizedClientId = getRequiredEnvValue(clientId);
	const normalizedClientSecret = getRequiredEnvValue(clientSecret);

	if (!normalizedClientId || !normalizedClientSecret) {
		return null;
	}

	return {
		clientId: normalizedClientId,
		clientSecret: normalizedClientSecret,
	};
}

function getScopes(value: string | undefined): string[] {
	const scopes =
		value
			?.split(",")
			.map((scope) => scope.trim())
			.filter(Boolean) ?? [];
	return scopes.length > 0 ? scopes : ["openid", "email", "profile"];
}

function hasAnyOidcValue(env: EnvSource, index: number): boolean {
	const prefix = `OIDC_${index}_`;
	return Object.keys(env).some(
		(key) => key.startsWith(prefix) && getRequiredEnvValue(env[key]),
	);
}

function getIndexedOidcProviders(env: EnvSource): OidcProviderConfig[] {
	const providers: OidcProviderConfig[] = [];

	for (let index = 1; hasAnyOidcValue(env, index); index += 1) {
		const prefix = `OIDC_${index}_`;
		const providerId = getRequiredEnvValue(env[`${prefix}PROVIDER_ID`]);
		const clientId = getRequiredEnvValue(env[`${prefix}CLIENT_ID`]);
		const clientSecret = getRequiredEnvValue(env[`${prefix}CLIENT_SECRET`]);
		const issuer = getRequiredEnvValue(env[`${prefix}ISSUER`]);

		if (!providerId || !clientId || !clientSecret || !issuer) {
			continue;
		}

		providers.push({
			providerId,
			displayName:
				getRequiredEnvValue(env[`${prefix}PROVIDER_NAME`]) ?? providerId,
			clientId,
			clientSecret,
			issuer,
			discoveryUrl: `${issuer}/.well-known/openid-configuration`,
			scopes: getScopes(env[`${prefix}SCOPES`]),
			pkce: true,
			allowAccountCreation: getBooleanEnvValue(
				env[`${prefix}ALLOW_ACCOUNT_CREATION`],
			),
		});
	}

	return providers;
}

export function getSocialProviderConfigs(
	env: EnvSource,
): Partial<Record<"google" | "github" | "discord", SocialProviderConfig>> {
	const google = getCredentialPair(env.AUTH_GOOGLE_ID, env.AUTH_GOOGLE_SECRET);
	const github = getCredentialPair(env.AUTH_GITHUB_ID, env.AUTH_GITHUB_SECRET);
	const discord = getCredentialPair(
		env.AUTH_DISCORD_ID,
		env.AUTH_DISCORD_SECRET,
	);

	return {
		...(google ? { google } : {}),
		...(github ? { github } : {}),
		...(discord ? { discord } : {}),
	};
}

export function getAuthConfig(env: EnvSource): AuthConfig {
	return {
		registration: {
			disableAll: getBooleanEnvValue(env.DISABLE_REGISTRATION),
			disableEmailPassword: getBooleanEnvValue(
				env.DISABLE_EMAIL_PASSWORD_REGISTRATION,
			),
		},
		emailPassword: {
			enabled: true,
		},
		socialProviders: getSocialProviderConfigs(env),
		oidcProviders: getIndexedOidcProviders(env),
	};
}
```

- [ ] **Step 4: Run tests to verify parser passes**

Run:

```bash
bun --filter openfit test:run src/lib/auth-config.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/openfit/src/lib/auth-config.ts apps/openfit/src/lib/auth-config.test.ts
git commit -m "feat: parse env-driven auth config"
```

### Task 2: Auth Policy Helpers

**Files:**
- Create: `apps/openfit/src/lib/auth-policy.ts`
- Create: `apps/openfit/src/lib/auth-policy.test.ts`

- [ ] **Step 1: Write failing policy tests**

Create `apps/openfit/src/lib/auth-policy.test.ts`.

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findFirst: vi.fn(),
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			users: {
				findFirst: mocks.findFirst,
			},
		},
	},
}));

import {
	canRequestOidcAccountCreation,
	getAuthProviderById,
	isEmailPasswordRegistrationAllowed,
	isFirstUserBootstrapAvailable,
} from "./auth-policy";

const baseConfig = {
	registration: {
		disableAll: false,
		disableEmailPassword: false,
	},
	emailPassword: {
		enabled: true as const,
	},
	socialProviders: {},
	oidcProviders: [
		{
			providerId: "authentik",
			displayName: "Authentik",
			clientId: "client",
			clientSecret: "secret",
			issuer: "https://auth.example.com",
			discoveryUrl: "https://auth.example.com/.well-known/openid-configuration",
			scopes: ["openid", "email", "profile"],
			pkce: true as const,
			allowAccountCreation: false,
		},
		{
			providerId: "authelia",
			displayName: "Authelia",
			clientId: "client-two",
			clientSecret: "secret-two",
			issuer: "https://sso.example.com",
			discoveryUrl: "https://sso.example.com/.well-known/openid-configuration",
			scopes: ["openid", "email", "profile"],
			pkce: true as const,
			allowAccountCreation: true,
		},
	],
};

describe("auth-policy", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reports bootstrap availability when no user exists", async () => {
		mocks.findFirst.mockResolvedValueOnce(undefined);

		await expect(isFirstUserBootstrapAvailable()).resolves.toBe(true);
		expect(mocks.findFirst).toHaveBeenCalledTimes(1);
	});

	it("allows email registration for first-user bootstrap", async () => {
		mocks.findFirst.mockResolvedValueOnce(undefined);

		await expect(
			isEmailPasswordRegistrationAllowed({
				...baseConfig,
				registration: {
					disableAll: true,
					disableEmailPassword: true,
				},
			}),
		).resolves.toBe(true);
	});

	it("blocks email registration after bootstrap when either email gate is disabled", async () => {
		mocks.findFirst.mockResolvedValue({ id: "existing-user" });

		await expect(
			isEmailPasswordRegistrationAllowed({
				...baseConfig,
				registration: {
					disableAll: true,
					disableEmailPassword: false,
				},
			}),
		).resolves.toBe(false);

		await expect(
			isEmailPasswordRegistrationAllowed({
				...baseConfig,
				registration: {
					disableAll: false,
					disableEmailPassword: true,
				},
			}),
		).resolves.toBe(false);
	});

	it("allows OIDC account creation for bootstrap or explicit provider opt-in", async () => {
		mocks.findFirst.mockResolvedValueOnce(undefined);
		await expect(
			canRequestOidcAccountCreation(baseConfig, "authentik"),
		).resolves.toBe(true);

		mocks.findFirst.mockResolvedValueOnce({ id: "existing-user" });
		await expect(
			canRequestOidcAccountCreation(baseConfig, "authelia"),
		).resolves.toBe(true);
	});

	it("blocks OIDC account creation when provider defaults closed", async () => {
		mocks.findFirst.mockResolvedValueOnce({ id: "existing-user" });

		await expect(
			canRequestOidcAccountCreation(baseConfig, "authentik"),
		).resolves.toBe(false);
	});

	it("finds configured OIDC providers by id", () => {
		expect(getAuthProviderById(baseConfig, "authentik")).toEqual(
			baseConfig.oidcProviders[0],
		);
		expect(getAuthProviderById(baseConfig, "missing")).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun --filter openfit test:run src/lib/auth-policy.test.ts
```

Expected: FAIL because `apps/openfit/src/lib/auth-policy.ts` does not exist.

- [ ] **Step 3: Implement policy helpers**

Create `apps/openfit/src/lib/auth-policy.ts`.

```ts
import { db } from "@/db";
import type { AuthConfig, OidcProviderConfig } from "@/lib/auth-config";

export async function isFirstUserBootstrapAvailable(): Promise<boolean> {
	const existingUser = await db.query.users.findFirst();
	return !existingUser;
}

export async function isEmailPasswordRegistrationAllowed(
	config: AuthConfig,
): Promise<boolean> {
	if (await isFirstUserBootstrapAvailable()) {
		return true;
	}

	return (
		!config.registration.disableAll &&
		!config.registration.disableEmailPassword
	);
}

export function getAuthProviderById(
	config: AuthConfig,
	providerId: string,
): OidcProviderConfig | undefined {
	return config.oidcProviders.find(
		(provider) => provider.providerId === providerId,
	);
}

export async function canRequestOidcAccountCreation(
	config: AuthConfig,
	providerId: string,
): Promise<boolean> {
	const provider = getAuthProviderById(config, providerId);
	if (!provider) {
		return false;
	}

	if (await isFirstUserBootstrapAvailable()) {
		return true;
	}

	return provider.allowAccountCreation;
}
```

- [ ] **Step 4: Run tests to verify policy passes**

Run:

```bash
bun --filter openfit test:run src/lib/auth-policy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/openfit/src/lib/auth-policy.ts apps/openfit/src/lib/auth-policy.test.ts
git commit -m "feat: add auth registration policy"
```

### Task 3: Better Auth Wiring And First-User Admin

**Files:**
- Modify: `apps/openfit/src/lib/auth.ts`
- Modify: `apps/openfit/src/lib/auth.test.ts`
- Modify: `apps/openfit/db/seed.ts`

- [ ] **Step 1: Write failing auth wiring tests**

Update `apps/openfit/src/lib/auth.test.ts` so the mocked `@/lib/auth-config` exports `getAuthConfig` instead of `getSocialProviderConfigs` and `getOidcProviderConfig`. Add expectations for multiple OIDC providers and first-user admin profile creation.

Use this shape in `loadAuthModule`:

```ts
const getAuthConfigMock = vi.fn();
const findFirstMock = vi.fn();

type CapturedAuthConfig = {
	baseURL?: string;
	emailAndPassword: {
		enabled: boolean;
	};
	socialProviders: Record<string, unknown>;
	plugins: unknown[];
	callbacks: {
		session: (args: {
			session: { user: Record<string, unknown>; [key: string]: unknown };
			user: { id: string };
		}) => unknown;
	};
	databaseHooks: {
		user: {
			create: {
				after: (user: { id: string }) => Promise<void>;
			};
		};
	};
};
```

Mock `@/db` with `query.users.findFirst`:

```ts
vi.doMock("@/db", () => ({
	db: {
		query: {
			users: {
				findFirst: findFirstMock,
			},
		},
		select: selectMock,
		insert: insertMock,
	},
}));
```

Set the default auth config mock:

```ts
getAuthConfigMock.mockReturnValue(
	options?.authConfig ?? {
		registration: {
			disableAll: false,
			disableEmailPassword: false,
		},
		emailPassword: {
			enabled: true,
		},
		socialProviders: {
			google: { clientId: "google", clientSecret: "secret" },
		},
		oidcProviders: [],
	},
);
```

Add this OIDC plugin test:

```ts
it("configures all indexed OIDC providers for generic OAuth", async () => {
	await loadAuthModule({
		nodeEnv: "production",
		authConfig: {
			registration: {
				disableAll: true,
				disableEmailPassword: false,
			},
			emailPassword: {
				enabled: true,
			},
			socialProviders: {},
			oidcProviders: [
				{
					providerId: "authentik",
					displayName: "Authentik",
					clientId: "oidc-client",
					clientSecret: "oidc-secret",
					issuer: "https://issuer.example.com",
					discoveryUrl:
						"https://issuer.example.com/.well-known/openid-configuration",
					scopes: ["openid", "email", "profile"],
					pkce: true,
					allowAccountCreation: false,
				},
				{
					providerId: "authelia",
					displayName: "Authelia",
					clientId: "authelia-client",
					clientSecret: "authelia-secret",
					issuer: "https://sso.example.com",
					discoveryUrl:
						"https://sso.example.com/.well-known/openid-configuration",
					scopes: ["openid", "email"],
					pkce: true,
					allowAccountCreation: true,
				},
			],
		},
	});

	expect(genericOAuthMock).toHaveBeenCalledWith({
		config: [
			expect.objectContaining({
				providerId: "authentik",
				clientId: "oidc-client",
				disableImplicitSignUp: true,
			}),
			expect.objectContaining({
				providerId: "authelia",
				clientId: "authelia-client",
				disableImplicitSignUp: false,
			}),
		],
	});
});
```

Add this profile role test:

```ts
it("creates the first user profile as admin and later profiles as users", async () => {
	findFirstMock.mockResolvedValueOnce(undefined);
	await loadAuthModule({
		nodeEnv: "development",
		socialProviders: {},
	});

	await capturedConfig.databaseHooks.user.create.after({ id: "first_user" });

	expect(insertValuesMock).toHaveBeenLastCalledWith(
		expect.objectContaining({
			userId: "first_user",
			role: "ADMIN",
		}),
	);

	findFirstMock.mockResolvedValueOnce({ id: "first_user" });
	await capturedConfig.databaseHooks.user.create.after({ id: "second_user" });

	expect(insertValuesMock).toHaveBeenLastCalledWith(
		expect.objectContaining({
			userId: "second_user",
			role: "USER",
		}),
	);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun --filter openfit test:run src/lib/auth.test.ts
```

Expected: FAIL because `auth.ts` still imports single-provider helpers and always creates `USER` profiles.

- [ ] **Step 3: Wire parsed auth config into Better Auth**

Update `apps/openfit/src/lib/auth.ts` imports and config setup. The profile hook runs after Better Auth inserts the current user, so it must look for any other existing user when deciding whether this is the first account.

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { getAuthConfig } from "@/lib/auth-config";

const authBaseURL =
	process.env.BETTER_AUTH_BASE_URL ??
	process.env.VITE_APP_URL ??
	(process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");

const authConfig = getAuthConfig(process.env);

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
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
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
```

- [ ] **Step 4: Keep seed idempotent**

In `apps/openfit/db/seed.ts`, keep the post-create admin update for `ADMIN_USER`. Add a comment that this is idempotent and still needed when the seeded admin is not the first user.

```ts
	// Ensure the seeded admin account is ADMIN even when other users already exist.
	await db
		.update(schema.userProfiles)
		.set({ role: "ADMIN" })
		.where(eq(schema.userProfiles.userId, result.user.id));
```

- [ ] **Step 5: Run tests to verify auth wiring passes**

Run:

```bash
bun --filter openfit test:run src/lib/auth.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/openfit/src/lib/auth.ts apps/openfit/src/lib/auth.test.ts apps/openfit/db/seed.ts
git commit -m "feat: wire env-driven oidc auth"
```

### Task 4: Auth Route Registration Gates

**Files:**
- Modify: `apps/openfit/src/routes/api/auth.$.ts`
- Modify: `apps/openfit/src/routes/api/auth.$.test.ts`

- [ ] **Step 1: Write failing route wrapper tests**

Update `apps/openfit/src/routes/api/auth.$.test.ts` to mock `getAuthConfig`, `isEmailPasswordRegistrationAllowed`, and `canRequestOidcAccountCreation`.

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	authHandler: vi.fn(),
	getAuthConfig: vi.fn(),
	isEmailPasswordRegistrationAllowed: vi.fn(),
	canRequestOidcAccountCreation: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	auth: {
		handler: mocks.authHandler,
	},
}));

vi.mock("@/lib/auth-config", () => ({
	getAuthConfig: mocks.getAuthConfig,
}));

vi.mock("@/lib/auth-policy", () => ({
	isEmailPasswordRegistrationAllowed: mocks.isEmailPasswordRegistrationAllowed,
	canRequestOidcAccountCreation: mocks.canRequestOidcAccountCreation,
}));

import AuthRoute from "@/routes/api/auth.$";

const handlers = AuthRoute.options.server?.handlers as {
	GET: ({ request }: { request: Request }) => Promise<Response>;
	POST: ({ request }: { request: Request }) => Promise<Response>;
};

const config = {
	registration: {
		disableAll: false,
		disableEmailPassword: false,
	},
	emailPassword: {
		enabled: true as const,
	},
	socialProviders: {},
	oidcProviders: [],
};

describe("api/auth/$", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.getAuthConfig.mockReturnValue(config);
		mocks.isEmailPasswordRegistrationAllowed.mockResolvedValue(true);
		mocks.canRequestOidcAccountCreation.mockResolvedValue(true);
		mocks.authHandler.mockResolvedValue(new Response("auth ok", { status: 207 }));
	});

	it("delegates GET to auth.handler", async () => {
		const request = new Request("http://localhost/api/auth/session");
		const response = await handlers.GET({ request });

		expect(mocks.authHandler).toHaveBeenCalledWith(request);
		expect(response.status).toBe(207);
		expect(await response.text()).toBe("auth ok");
	});

	it("blocks disabled email registration before auth.handler", async () => {
		mocks.isEmailPasswordRegistrationAllowed.mockResolvedValueOnce(false);
		const request = new Request("http://localhost/api/auth/sign-up/email", {
			method: "POST",
			body: JSON.stringify({
				email: "person@example.com",
				password: "Password1!",
				name: "person",
			}),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await handlers.POST({ request });

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({
			error: "Email/password registration is disabled",
		});
		expect(mocks.authHandler).not.toHaveBeenCalled();
	});

	it("allows email registration when policy allows it", async () => {
		const request = new Request("http://localhost/api/auth/sign-up/email", {
			method: "POST",
			body: JSON.stringify({
				email: "first@example.com",
				password: "Password1!",
				name: "first",
			}),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await handlers.POST({ request });

		expect(mocks.authHandler).toHaveBeenCalledWith(request);
		expect(response.status).toBe(207);
	});

	it("blocks OIDC requestSignUp when the provider cannot create accounts", async () => {
		mocks.canRequestOidcAccountCreation.mockResolvedValueOnce(false);
		const request = new Request("http://localhost/api/auth/sign-in/oauth2", {
			method: "POST",
			body: JSON.stringify({
				providerId: "authentik",
				callbackURL: "/",
				requestSignUp: true,
			}),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await handlers.POST({ request });

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({
			error: "Account creation is disabled for this OIDC provider",
		});
		expect(mocks.authHandler).not.toHaveBeenCalled();
	});

	it("delegates OIDC sign-in when requestSignUp is absent", async () => {
		const request = new Request("http://localhost/api/auth/sign-in/oauth2", {
			method: "POST",
			body: JSON.stringify({
				providerId: "authentik",
				callbackURL: "/",
			}),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await handlers.POST({ request });

		expect(mocks.canRequestOidcAccountCreation).not.toHaveBeenCalled();
		expect(mocks.authHandler).toHaveBeenCalledWith(request);
		expect(response.status).toBe(207);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun --filter openfit test:run src/routes/api/auth.$.test.ts
```

Expected: FAIL because the route currently delegates all POST requests directly.

- [ ] **Step 3: Implement route gates**

Update `apps/openfit/src/routes/api/auth.$.ts`.

```ts
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { getAuthConfig } from "@/lib/auth-config";
import {
	canRequestOidcAccountCreation,
	isEmailPasswordRegistrationAllowed,
} from "@/lib/auth-policy";

function isEmailSignUpRequest(request: Request): boolean {
	return (
		request.method === "POST" &&
		new URL(request.url).pathname.endsWith("/api/auth/sign-up/email")
	);
}

function isOidcSignInRequest(request: Request): boolean {
	return (
		request.method === "POST" &&
		new URL(request.url).pathname.endsWith("/api/auth/sign-in/oauth2")
	);
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
	const contentType = request.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		return {};
	}

	const body = await request.clone().json();
	return body && typeof body === "object" ? body : {};
}

async function enforceRegistrationPolicy(request: Request): Promise<Response | null> {
	const authConfig = getAuthConfig(process.env);

	if (isEmailSignUpRequest(request)) {
		const allowed = await isEmailPasswordRegistrationAllowed(authConfig);
		if (!allowed) {
			return Response.json(
				{ error: "Email/password registration is disabled" },
				{ status: 403 },
			);
		}
	}

	if (isOidcSignInRequest(request)) {
		const body = await readJsonBody(request);
		if (body.requestSignUp === true && typeof body.providerId === "string") {
			const allowed = await canRequestOidcAccountCreation(
				authConfig,
				body.providerId,
			);
			if (!allowed) {
				return Response.json(
					{ error: "Account creation is disabled for this OIDC provider" },
					{ status: 403 },
				);
			}
		}
	}

	return null;
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => auth.handler(request),
			POST: async ({ request }: { request: Request }) => {
				const policyResponse = await enforceRegistrationPolicy(request);
				return policyResponse ?? auth.handler(request);
			},
		},
	},
});

export default Route;
```

- [ ] **Step 4: Run tests to verify route gates pass**

Run:

```bash
bun --filter openfit test:run src/routes/api/auth.$.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/openfit/src/routes/api/auth.$.ts apps/openfit/src/routes/api/auth.$.test.ts
git commit -m "feat: enforce auth registration gates"
```

### Task 5: Provider Status API

**Files:**
- Modify: `apps/openfit/src/routes/api/auth/providers.ts`
- Modify: `apps/openfit/src/routes/api/-auth-providers.test.ts`

- [ ] **Step 1: Write failing provider status tests**

Replace `apps/openfit/src/routes/api/-auth-providers.test.ts` with tests for the new response shape.

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	isEmailPasswordRegistrationAllowed: vi.fn(),
	isFirstUserBootstrapAvailable: vi.fn(),
}));

vi.mock("@/lib/auth-policy", () => ({
	isEmailPasswordRegistrationAllowed: mocks.isEmailPasswordRegistrationAllowed,
	isFirstUserBootstrapAvailable: mocks.isFirstUserBootstrapAvailable,
}));

import AuthProvidersRoute from "@/routes/api/auth/providers";

const handlers = AuthProvidersRoute.options.server?.handlers as {
	GET: () => Promise<Response> | Response;
};

const envKeys = [
	"AUTH_GOOGLE_ID",
	"AUTH_GOOGLE_SECRET",
	"DISABLE_REGISTRATION",
	"DISABLE_EMAIL_PASSWORD_REGISTRATION",
	"OIDC_1_PROVIDER_ID",
	"OIDC_1_PROVIDER_NAME",
	"OIDC_1_CLIENT_ID",
	"OIDC_1_CLIENT_SECRET",
	"OIDC_1_ISSUER",
	"OIDC_1_ALLOW_ACCOUNT_CREATION",
];

const originalEnv = new Map<string, string | undefined>();

beforeEach(() => {
	for (const key of envKeys) {
		originalEnv.set(key, process.env[key]);
		delete process.env[key];
	}
	mocks.isEmailPasswordRegistrationAllowed.mockResolvedValue(true);
	mocks.isFirstUserBootstrapAvailable.mockResolvedValue(false);
});

afterEach(() => {
	for (const key of envKeys) {
		const value = originalEnv.get(key);
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}
});

describe("GET /api/auth/providers", () => {
	it("returns auth surface without secrets", async () => {
		process.env.AUTH_GOOGLE_ID = "google_id";
		process.env.AUTH_GOOGLE_SECRET = "google_secret";
		process.env.DISABLE_EMAIL_PASSWORD_REGISTRATION = "true";
		process.env.OIDC_1_PROVIDER_ID = "authentik";
		process.env.OIDC_1_PROVIDER_NAME = "Authentik";
		process.env.OIDC_1_CLIENT_ID = "oidc_client";
		process.env.OIDC_1_CLIENT_SECRET = "oidc_secret";
		process.env.OIDC_1_ISSUER = "https://issuer.example.com";
		process.env.OIDC_1_ALLOW_ACCOUNT_CREATION = "true";

		const response = await handlers.GET();
		const bodyText = await response.clone().text();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			emailPassword: {
				signInEnabled: true,
				registrationEnabled: expect.any(Boolean),
			},
			bootstrapAvailable: expect.any(Boolean),
			providers: [
				{
					id: "google",
					name: "Google",
					type: "social",
				},
				{
					id: "authentik",
					name: "Authentik",
					type: "oidc",
					allowAccountCreation: true,
				},
			],
		});
		expect(bodyText).not.toContain("oidc_secret");
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun --filter openfit test:run src/routes/api/-auth-providers.test.ts
```

Expected: FAIL because the endpoint still returns `{ google, github, discord, oidc }`.

- [ ] **Step 3: Implement new provider status API**

Update `apps/openfit/src/routes/api/auth/providers.ts`.

```ts
import { createFileRoute } from "@tanstack/react-router";
import { getAuthConfig } from "@/lib/auth-config";
import {
	isEmailPasswordRegistrationAllowed,
	isFirstUserBootstrapAvailable,
} from "@/lib/auth-policy";

const socialProviderNames = {
	google: "Google",
	github: "GitHub",
	discord: "Discord",
} as const;

export const Route = createFileRoute("/api/auth/providers")({
	server: {
		handlers: {
			GET: async () => {
				const authConfig = getAuthConfig(process.env);
				const [registrationEnabled, bootstrapAvailable] = await Promise.all([
					isEmailPasswordRegistrationAllowed(authConfig),
					isFirstUserBootstrapAvailable(),
				]);

				return Response.json({
					emailPassword: {
						signInEnabled: authConfig.emailPassword.enabled,
						registrationEnabled,
					},
					bootstrapAvailable,
					providers: [
						...Object.keys(authConfig.socialProviders).map((id) => ({
							id,
							name:
								socialProviderNames[
									id as keyof typeof socialProviderNames
								],
							type: "social" as const,
						})),
						...authConfig.oidcProviders.map((provider) => ({
							id: provider.providerId,
							name: provider.displayName,
							type: "oidc" as const,
							allowAccountCreation: provider.allowAccountCreation,
						})),
					],
				});
			},
		},
	},
});

export default Route;
```

- [ ] **Step 4: Run tests to verify provider API passes**

Run:

```bash
bun --filter openfit test:run src/routes/api/-auth-providers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/openfit/src/routes/api/auth/providers.ts apps/openfit/src/routes/api/-auth-providers.test.ts
git commit -m "feat: expose auth provider status"
```

### Task 6: Login And Register UI

**Files:**
- Modify: `apps/openfit/src/components/auth/login-form.tsx`
- Modify: `apps/openfit/src/components/auth/login-form.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Add tests to `apps/openfit/src/components/auth/login-form.test.tsx` for server-driven providers and disabled registration.

```ts
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
	expect(screen.queryByRole("button", { name: "Register" })).toBeNull();
});
```

At the top of the test file, add a fetch mock:

```ts
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;
```

In `beforeEach`, provide the default provider response:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun --filter openfit test:run src/components/auth/login-form.test.tsx
```

Expected: FAIL because `LoginForm` still reads `import.meta.env` and always renders email registration.

- [ ] **Step 3: Implement provider status loading**

In `apps/openfit/src/components/auth/login-form.tsx`, replace `getOAuthProviders()` with API-driven state.

```ts
type AuthProvider = {
	id: string;
	name: string;
	type: "social" | "oidc";
	allowAccountCreation?: boolean;
};

type AuthProviderStatus = {
	emailPassword: {
		signInEnabled: boolean;
		registrationEnabled: boolean;
	};
	bootstrapAvailable: boolean;
	providers: AuthProvider[];
};

const defaultProviderStatus: AuthProviderStatus = {
	emailPassword: {
		signInEnabled: true,
		registrationEnabled: true,
	},
	bootstrapAvailable: false,
	providers: [],
};
```

Inside `LoginForm`, add:

```ts
const [providerStatus, setProviderStatus] =
	useState<AuthProviderStatus>(defaultProviderStatus);

useEffect(() => {
	let isMounted = true;
	const loadProviders = async () => {
		try {
			const response = await fetch("/api/auth/providers");
			if (!response.ok) {
				return;
			}
			const data = (await response.json()) as AuthProviderStatus;
			if (isMounted) {
				setProviderStatus(data);
			}
		} catch {
			if (isMounted) {
				setProviderStatus(defaultProviderStatus);
			}
		}
	};
	void loadProviders();
	return () => {
		isMounted = false;
	};
}, []);

const oauthProviders = providerStatus.providers;
const canRegisterWithEmail =
	providerStatus.emailPassword.registrationEnabled ||
	providerStatus.bootstrapAvailable;
```

Update OIDC sign-in:

```ts
const handleOAuthSignIn = async (provider: AuthProvider) => {
	setOauthLoading(provider.id);
	try {
		await (provider.type === "oidc"
			? signIn.oauth2({
					providerId: provider.id,
					callbackURL: "/",
					...(providerStatus.bootstrapAvailable
						? { requestSignUp: true }
						: {}),
				})
			: signIn.social({
					provider: provider.id as "google" | "github" | "discord",
					callbackURL: "/",
				}));
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "OAuth sign-in failed";
		setPasswordError([message]);
		setOauthLoading(undefined);
	}
};
```

Update the provider button loop:

```tsx
{oauthProviders.map((provider) => {
	const icon = PROVIDER_ICONS[provider.id] ?? PROVIDER_ICONS.oidc;
	return (
		<Button
			key={provider.id}
			type="button"
			variant="outline"
			className="w-full"
			disabled={oauthLoading !== undefined}
			onClick={async () => handleOAuthSignIn(provider)}
		>
			{oauthLoading === provider.id ? (
				<span className="animate-spin mr-2">⏳</span>
			) : (
				<span className="mr-2">{icon}</span>
			)}
			Continue with {provider.name}
		</Button>
	);
})}
```

Render the provider button block before the email form/unavailable state so OIDC remains usable when email registration is disabled. Then guard only the email registration form:

```tsx
<div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-sm) flex flex-1 flex-col items-center justify-center gap-4">
	<div className="flex w-full max-w-sm flex-col gap-4">
		{hasOAuthProviders && (
			<>
				<div className="flex flex-col gap-2">
					{oauthProviders.map((provider) => {
						const icon = PROVIDER_ICONS[provider.id] ?? PROVIDER_ICONS.oidc;
						return (
							<Button
								key={provider.id}
								type="button"
								variant="outline"
								className="w-full"
								disabled={oauthLoading !== undefined}
								onClick={async () => handleOAuthSignIn(provider)}
							>
								{oauthLoading === provider.id ? (
									<span className="animate-spin mr-2">⏳</span>
								) : (
									<span className="mr-2">{icon}</span>
								)}
								Continue with {provider.name}
							</Button>
						);
					})}
				</div>

				{(!register || canRegisterWithEmail) && (
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<Separator className="w-full" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">
								Or continue with email
							</span>
						</div>
					</div>
				)}
			</>
		)}

		{register && !canRegisterWithEmail ? (
			<>
				<p className="text-sm text-muted-foreground">
					Email/password registration is disabled
				</p>
				<Button variant="outline" className="w-full" asChild>
					<Link to="/signin">Back to sign in</Link>
				</Button>
			</>
		) : (
			<form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className={emailError.length > 0 ? "border-destructive" : ""}
					/>
					{emailError.length > 0 && (
						<p className="text-sm text-destructive">{emailError[0]}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className={passwordError.length > 0 ? "border-destructive" : ""}
					/>
					{passwordError.length > 0 && (
						<p className="text-sm text-destructive">{passwordError[0]}</p>
					)}
				</div>

				<Button type="submit" disabled={loading} className="w-full">
					{submitLabel}
				</Button>

				{register ? (
					<Button variant="outline" className="w-full" asChild>
						<Link to="/signin">Back to sign in</Link>
					</Button>
				) : (
					canRegisterWithEmail && (
						<Button variant="outline" className="w-full" asChild>
							<Link to="/register">Create an account</Link>
						</Button>
					)
				)}
			</form>
		)}
	</div>
</div>
```

In the sign-in footer, only render `Create an account` when `canRegisterWithEmail` is true.

- [ ] **Step 4: Run tests to verify UI passes**

Run:

```bash
bun --filter openfit test:run src/components/auth/login-form.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/openfit/src/components/auth/login-form.tsx apps/openfit/src/components/auth/login-form.test.tsx
git commit -m "feat: render auth UI from provider status"
```

### Task 7: Remove Admin Auth Provider UI

**Files:**
- Delete: `apps/openfit/src/components/admin/auth-providers-table.tsx`
- Modify: `apps/openfit/src/components/admin/admin-page.tsx`
- Modify: `apps/openfit/src/components/admin/admin-page.test.tsx`
- Modify: `apps/openfit/src/components/admin/admin-tables.test.tsx`

- [ ] **Step 1: Write failing admin cleanup expectation**

Update `apps/openfit/src/components/admin/admin-page.test.tsx` so it expects only two tabs: Shared Entities and Users.

```ts
it("renders shared entities and users tabs", async () => {
	const screen = await render(<AdminPage />);

	await expect
		.element(screen.getByRole("tab", { name: /shared entities/i }))
		.toBeInTheDocument();
	await expect
		.element(screen.getByRole("tab", { name: /users/i }))
		.toBeInTheDocument();
	expect(screen.queryByRole("tab", { name: /auth/i })).toBeNull();
});
```

Remove the `vi.mock("./auth-providers-table", ...)` mock from that file.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun --filter openfit test:run src/components/admin/admin-page.test.tsx
```

Expected: FAIL because Admin still renders the Auth tab.

- [ ] **Step 3: Remove the Admin Auth tab**

Update `apps/openfit/src/components/admin/admin-page.tsx`.

```tsx
import { Database, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SharedEntitiesView } from "./shared-entities-view";
import { UserTable } from "./user-table";

export function AdminPage() {
	return (
		<div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) mt-8 pb-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Admin Panel</h1>
				<p className="text-muted-foreground">
					Manage global lookup data and users
				</p>
			</div>

			<Tabs defaultValue="entities" className="w-full">
				<TabsList className="grid w-full grid-cols-2 mb-6">
					<TabsTrigger value="entities" className="flex items-center gap-2">
						<Database className="h-4 w-4" />
						<span>Shared Entities</span>
					</TabsTrigger>
					<TabsTrigger value="users" className="flex items-center gap-2">
						<Users className="h-4 w-4" />
						<span>Users</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="entities">
					<SharedEntitiesView />
				</TabsContent>

				<TabsContent value="users">
					<UserTable />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default AdminPage;
```

- [ ] **Step 4: Delete auth provider table and remove table tests**

Delete `apps/openfit/src/components/admin/auth-providers-table.tsx`.

In `apps/openfit/src/components/admin/admin-tables.test.tsx`, remove the import:

```ts
import { AuthProvidersTable } from "./auth-providers-table";
```

Remove these `AuthProvidersTable` tests:

- `renders auth provider configuration status from the API`
- `uses a custom OIDC provider label when the environment provides one`
- `keeps auth providers visible when the status request fails`
- `ignores provider status updates after the component unmounts`

- [ ] **Step 5: Run admin tests**

Run:

```bash
bun --filter openfit test:run src/components/admin/admin-page.test.tsx src/components/admin/admin-tables.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/openfit/src/components/admin/admin-page.tsx apps/openfit/src/components/admin/admin-page.test.tsx apps/openfit/src/components/admin/admin-tables.test.tsx
git rm apps/openfit/src/components/admin/auth-providers-table.tsx
git commit -m "refactor: remove admin auth provider ui"
```

### Task 8: Docs And Environment Examples

**Files:**
- Modify: `apps/openfit/.env.example`
- Modify: `apps/openfit/README.md`

- [ ] **Step 1: Update `.env.example`**

Replace the Generic OIDC section in `apps/openfit/.env.example` with:

```env
# -----------------------------------------------------------------------------
# Registration
# -----------------------------------------------------------------------------

# Blocks all self-service account creation except first-user bootstrap and OIDC
# providers where OIDC_N_ALLOW_ACCOUNT_CREATION=true.
# DISABLE_REGISTRATION=true

# Blocks email/password signup only. Existing email/password users can still
# sign in. First-user bootstrap is still allowed.
# DISABLE_EMAIL_PASSWORD_REGISTRATION=true

# -----------------------------------------------------------------------------
# Generic OIDC Providers (optional)
# -----------------------------------------------------------------------------
# Configure self-hosted providers such as Authentik, Authelia, or Keycloak.
# Each provider requires PROVIDER_ID, CLIENT_ID, CLIENT_SECRET, and ISSUER.
# OIDC account creation defaults to false unless explicitly enabled.

# OIDC_1_PROVIDER_ID=authentik
# OIDC_1_PROVIDER_NAME=Authentik
# OIDC_1_CLIENT_ID=
# OIDC_1_CLIENT_SECRET=
# OIDC_1_ISSUER=https://auth.example.com/application/o/openfit/
# OIDC_1_SCOPES=openid,email,profile
# OIDC_1_ALLOW_ACCOUNT_CREATION=false

# OIDC_2_PROVIDER_ID=authelia
# OIDC_2_PROVIDER_NAME=Authelia
# OIDC_2_CLIENT_ID=
# OIDC_2_CLIENT_SECRET=
# OIDC_2_ISSUER=https://sso.example.com
# OIDC_2_ALLOW_ACCOUNT_CREATION=false
```

Remove these legacy lines:

```env
# AUTH_OIDC_CLIENT_ID=
# AUTH_OIDC_CLIENT_SECRET=
# AUTH_OIDC_ISSUER=https://auth.example.com
# VITE_AUTH_OIDC_ENABLED=true
# VITE_AUTH_OIDC_PROVIDER_NAME=SSO
```

- [ ] **Step 2: Update self-hosting README**

Add an auth configuration section to `apps/openfit/README.md`:

```md
## Self-Hosted Auth Configuration

OpenFit auth is configured with environment variables. The production Docker
container reads these values at startup.

Email/password sign-in is enabled by default. Set
`DISABLE_EMAIL_PASSWORD_REGISTRATION=true` to block new email/password signups
while keeping existing email/password sign-in working.

Set `DISABLE_REGISTRATION=true` to block self-service account creation after
the first user is created. OIDC providers can still auto-provision users when
their indexed provider config sets `OIDC_N_ALLOW_ACCOUNT_CREATION=true`.

The first account created on a fresh install becomes an admin whether it is
created through email/password or OIDC.

OIDC providers are configured with indexed variables:

```env
OIDC_1_PROVIDER_ID=authentik
OIDC_1_PROVIDER_NAME=Authentik
OIDC_1_CLIENT_ID=replace-with-client-id
OIDC_1_CLIENT_SECRET=replace-with-client-secret
OIDC_1_ISSUER=https://auth.example.com/application/o/openfit/
OIDC_1_ALLOW_ACCOUNT_CREATION=true
```

Use this callback URL in the OIDC provider:

```text
https://your-openfit-host.example.com/api/auth/oauth2/callback/<provider-id>
```
```

- [ ] **Step 3: Commit docs**

```bash
git add apps/openfit/.env.example apps/openfit/README.md
git commit -m "docs: document env-driven auth setup"
```

### Task 9: Final Verification

**Files:**
- No source files changed in this task.

- [ ] **Step 1: Run focused auth tests**

Run:

```bash
bun --filter openfit test:run src/lib/auth-config.test.ts src/lib/auth-policy.test.ts src/lib/auth.test.ts src/routes/api/auth.$.test.ts src/routes/api/-auth-providers.test.ts src/components/auth/login-form.test.tsx src/components/admin/admin-page.test.tsx src/components/admin/admin-tables.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full unit test suite**

Run:

```bash
bun run test:run
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
bun run lint
```

Expected: PASS.

- [ ] **Step 4: Build OpenFit**

Run:

```bash
bun run build:openfit
```

Expected: PASS.

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intentional committed changes are present, with no untracked files. If `bun.lock` changed only because `bun install` was run with a different Bun patch version, leave it out of the feature commits unless dependency resolution changes are required by tests.
