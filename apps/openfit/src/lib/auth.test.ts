import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = {
	BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL,
	VITE_APP_URL: process.env.VITE_APP_URL,
	NODE_ENV: process.env.NODE_ENV,
};

const betterAuthMock = vi.fn();
const drizzleAdapterMock = vi.fn();
const genericOAuthMock = vi.fn();
const getAuthConfigMock = vi.fn();
const nanoidMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();
const limitMock = vi.fn();
const allMock = vi.fn();
const insertMock = vi.fn();
const insertValuesMock = vi.fn();
const insertRunMock = vi.fn();
const findFirstMock = vi.fn();
const neMock = vi.fn();

const schemaMock = {
	users: { id: "users.id", email: "users.email" },
	sessions: "sessions",
	accounts: "accounts",
	verifications: "verifications",
	repetitionUnits: { table: "repetition_units" },
	weightUnits: { table: "weight_units" },
	userProfiles: "user_profiles",
};

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

let capturedConfig: CapturedAuthConfig;
let repetitionUnitsResult: Array<{ id: string }>;
let weightUnitsResult: Array<{ id: string }>;

async function loadAuthModule(options?: {
	betterAuthBaseUrl?: string;
	nodeEnv?: string;
	authConfig?: Record<string, unknown>;
	repetitionUnits?: Array<{ id: string }>;
	viteAppUrl?: string;
	weightUnits?: Array<{ id: string }>;
}) {
	vi.resetModules();

	delete process.env.BETTER_AUTH_BASE_URL;
	delete process.env.VITE_APP_URL;
	delete process.env.NODE_ENV;

	if (options?.betterAuthBaseUrl !== undefined) {
		process.env.BETTER_AUTH_BASE_URL = options.betterAuthBaseUrl;
	}
	if (options?.viteAppUrl !== undefined) {
		process.env.VITE_APP_URL = options.viteAppUrl;
	}
	if (options?.nodeEnv !== undefined) {
		process.env.NODE_ENV = options.nodeEnv;
	}

	repetitionUnitsResult = options?.repetitionUnits ?? [{ id: "rep_unit" }];
	weightUnitsResult = options?.weightUnits ?? [{ id: "weight_unit" }];

	betterAuthMock.mockImplementation((config) => {
		capturedConfig = config as CapturedAuthConfig;
		return {
			api: {
				getSession: vi.fn(),
			},
		};
	});
	drizzleAdapterMock.mockReturnValue("drizzle-adapter");
	genericOAuthMock.mockImplementation((plugin) => ({
		type: "generic-oauth",
		plugin,
	}));
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
	nanoidMock.mockReturnValue("profile_123");
	neMock.mockReturnValue("not-created-user-condition");

	selectMock.mockReturnValue({ from: fromMock });
	fromMock.mockImplementation((table) => {
		const result =
			table === schemaMock.repetitionUnits
				? repetitionUnitsResult
				: weightUnitsResult;
		return {
			limit: limitMock.mockImplementation(() => ({
				all: allMock.mockImplementation(() => result),
			})),
		};
	});
	insertMock.mockReturnValue({
		values: insertValuesMock.mockReturnValue({
			run: insertRunMock,
		}),
	});

	vi.doMock("better-auth", () => ({
		betterAuth: betterAuthMock,
	}));
	vi.doMock("better-auth/adapters/drizzle", () => ({
		drizzleAdapter: drizzleAdapterMock,
	}));
	vi.doMock("better-auth/plugins", () => ({
		genericOAuth: genericOAuthMock,
	}));
	vi.doMock("drizzle-orm", () => ({
		ne: neMock,
	}));
	vi.doMock("nanoid", () => ({
		nanoid: nanoidMock,
	}));
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
	vi.doMock("@/db/schema", () => ({
		schema: schemaMock,
	}));
	vi.doMock("@/lib/auth-config", () => ({
		getAuthConfig: getAuthConfigMock,
	}));

	return import("./auth");
}

function restoreEnv() {
	if (originalEnv.BETTER_AUTH_BASE_URL === undefined) {
		delete process.env.BETTER_AUTH_BASE_URL;
	} else {
		process.env.BETTER_AUTH_BASE_URL = originalEnv.BETTER_AUTH_BASE_URL;
	}
	if (originalEnv.VITE_APP_URL === undefined) {
		delete process.env.VITE_APP_URL;
	} else {
		process.env.VITE_APP_URL = originalEnv.VITE_APP_URL;
	}
	if (originalEnv.NODE_ENV === undefined) {
		delete process.env.NODE_ENV;
	} else {
		process.env.NODE_ENV = originalEnv.NODE_ENV;
	}
}

describe("auth", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		restoreEnv();
	});

	it("uses BETTER_AUTH_BASE_URL when configured and injects the user id into session callbacks", async () => {
		await loadAuthModule({
			betterAuthBaseUrl: "https://auth.example.com",
			viteAppUrl: "https://app.example.com",
			nodeEnv: "development",
		});

		expect(betterAuthMock).toHaveBeenCalledTimes(1);
		expect(capturedConfig.baseURL).toBe("https://auth.example.com");
		expect(capturedConfig.emailAndPassword.enabled).toBe(true);
		expect(capturedConfig.socialProviders).toEqual({
			google: { clientId: "google", clientSecret: "secret" },
		});
		expect(capturedConfig.plugins).toEqual([]);
		expect(getAuthConfigMock).toHaveBeenCalledWith(process.env);
		expect(drizzleAdapterMock).toHaveBeenCalledWith(
			expect.objectContaining({
				select: selectMock,
				insert: insertMock,
			}),
			expect.objectContaining({
				provider: "sqlite",
			}),
		);
		expect(
			capturedConfig.callbacks.session({
				session: { token: "abc", user: { email: "athlete@example.com" } },
				user: { id: "user_123" },
			}),
		).toEqual({
			token: "abc",
			user: {
				email: "athlete@example.com",
				id: "user_123",
			},
		});
	});

	it("falls back to the local dev base URL and skips OIDC plugins when no providers are configured", async () => {
		await loadAuthModule({
			nodeEnv: "development",
			authConfig: {
				registration: {
					disableAll: false,
					disableEmailPassword: false,
				},
				emailPassword: {
					enabled: true,
				},
				socialProviders: {},
				oidcProviders: [],
			},
		});

		expect(capturedConfig.baseURL).toBe("http://localhost:3000");
		expect(capturedConfig.plugins).toEqual([]);
		expect(capturedConfig.socialProviders).toEqual({});
	});

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

	it("creates the first user profile as admin and later profiles as users", async () => {
		findFirstMock.mockResolvedValueOnce(undefined);
		await loadAuthModule({
			nodeEnv: "development",
			authConfig: {
				registration: {
					disableAll: false,
					disableEmailPassword: false,
				},
				emailPassword: {
					enabled: true,
				},
				socialProviders: {},
				oidcProviders: [],
			},
		});

		await capturedConfig.databaseHooks.user.create.after({ id: "first_user" });

		expect(neMock).toHaveBeenCalledWith(schemaMock.users.id, "first_user");
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
		expect(insertRunMock).toHaveBeenCalledTimes(2);
	});
});
