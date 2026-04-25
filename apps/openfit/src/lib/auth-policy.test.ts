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
		vi.resetAllMocks();
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

	it("allows email registration when gates are open without checking bootstrap", async () => {
		await expect(isEmailPasswordRegistrationAllowed(baseConfig)).resolves.toBe(
			true,
		);
		expect(mocks.findFirst).not.toHaveBeenCalled();
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

	it("allows OIDC account creation for provider opt-in without checking bootstrap", async () => {
		await expect(
			canRequestOidcAccountCreation(baseConfig, "authelia"),
		).resolves.toBe(true);
		expect(mocks.findFirst).not.toHaveBeenCalled();
	});

	it("blocks OIDC account creation when provider defaults closed", async () => {
		mocks.findFirst.mockResolvedValueOnce({ id: "existing-user" });

		await expect(
			canRequestOidcAccountCreation(baseConfig, "authentik"),
		).resolves.toBe(false);
	});

	it("blocks OIDC account creation when provider is missing", async () => {
		await expect(
			canRequestOidcAccountCreation(baseConfig, "missing"),
		).resolves.toBe(false);
		expect(mocks.findFirst).not.toHaveBeenCalled();
	});

	it("finds configured OIDC providers by id", () => {
		expect(getAuthProviderById(baseConfig, "authentik")).toEqual(
			baseConfig.oidcProviders[0],
		);
		expect(getAuthProviderById(baseConfig, "missing")).toBeUndefined();
	});
});
