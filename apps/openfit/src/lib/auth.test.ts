import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = {
	BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL,
	VITE_APP_URL: process.env.VITE_APP_URL,
	NODE_ENV: process.env.NODE_ENV,
};

const betterAuthMock = vi.fn();
const drizzleAdapterMock = vi.fn();
const genericOAuthMock = vi.fn();
const getSocialProviderConfigsMock = vi.fn();
const getOidcProviderConfigMock = vi.fn();
const nanoidMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();
const limitMock = vi.fn();
const allMock = vi.fn();
const insertMock = vi.fn();
const insertValuesMock = vi.fn();
const insertRunMock = vi.fn();

const schemaMock = {
	users: "users",
	sessions: "sessions",
	accounts: "accounts",
	verifications: "verifications",
	repetitionUnits: { table: "repetition_units" },
	weightUnits: { table: "weight_units" },
	userProfiles: "user_profiles",
};

type CapturedAuthConfig = {
	baseURL?: string;
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
	oidcProviderConfig?: Record<string, unknown> | null;
	repetitionUnits?: Array<{ id: string }>;
	socialProviders?: Record<string, unknown>;
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
	getSocialProviderConfigsMock.mockReturnValue(
		options?.socialProviders ?? {
			google: { clientId: "google", clientSecret: "secret" },
		},
	);
	getOidcProviderConfigMock.mockReturnValue(
		options?.oidcProviderConfig ?? null,
	);
	nanoidMock.mockReturnValue("profile_123");

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
	vi.doMock("nanoid", () => ({
		nanoid: nanoidMock,
	}));
	vi.doMock("@/db", () => ({
		db: {
			select: selectMock,
			insert: insertMock,
		},
	}));
	vi.doMock("@/db/schema", () => ({
		schema: schemaMock,
	}));
	vi.doMock("@/lib/auth-config", () => ({
		getOidcProviderConfig: getOidcProviderConfigMock,
		getSocialProviderConfigs: getSocialProviderConfigsMock,
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
		expect(capturedConfig.plugins).toEqual([]);
		expect(getSocialProviderConfigsMock).toHaveBeenCalledWith(process.env);
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

	it("falls back to the local dev base URL when no explicit URL is configured", async () => {
		await loadAuthModule({
			nodeEnv: "development",
			socialProviders: {},
		});

		expect(capturedConfig.baseURL).toBe("http://localhost:3000");
		expect(capturedConfig.plugins).toEqual([]);
	});

	it("omits the base URL in production, configures OIDC, and seeds a user profile after creation", async () => {
		await loadAuthModule({
			nodeEnv: "production",
			oidcProviderConfig: {
				clientId: "oidc-client",
				clientSecret: "oidc-secret",
				discoveryUrl:
					"https://issuer.example.com/.well-known/openid-configuration",
				scopes: ["openid", "email", "profile"],
				pkce: true,
			},
			repetitionUnits: [],
			weightUnits: [],
			socialProviders: {},
		});

		expect(capturedConfig.baseURL).toBeUndefined();
		expect(genericOAuthMock).toHaveBeenCalledWith({
			config: [
				expect.objectContaining({
					providerId: "oidc",
					clientId: "oidc-client",
				}),
			],
		});
		expect(capturedConfig.plugins).toEqual([
			{
				type: "generic-oauth",
				plugin: {
					config: [
						expect.objectContaining({
							providerId: "oidc",
						}),
					],
				},
			},
		]);

		await capturedConfig.databaseHooks.user.create.after({ id: "user_123" });

		expect(selectMock).toHaveBeenCalledTimes(2);
		expect(insertMock).toHaveBeenCalledWith(schemaMock.userProfiles);
		expect(insertValuesMock).toHaveBeenCalledWith({
			id: "profile_123",
			userId: "user_123",
			role: "USER",
			defaultRepetitionUnitId: null,
			defaultWeightUnitId: null,
			theme: "system",
		});
		expect(insertRunMock).toHaveBeenCalledTimes(1);
	});
});
