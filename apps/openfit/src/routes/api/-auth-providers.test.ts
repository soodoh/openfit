import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	isEmailPasswordRegistrationAllowedForBootstrapState: vi.fn(),
	isFirstUserBootstrapAvailable: vi.fn(),
}));

vi.mock("@/lib/auth-policy", () => ({
	isEmailPasswordRegistrationAllowedForBootstrapState:
		mocks.isEmailPasswordRegistrationAllowedForBootstrapState,
	isFirstUserBootstrapAvailable: mocks.isFirstUserBootstrapAvailable,
}));

import AuthProvidersRoute from "@/routes/api/auth/providers";

const handlers = AuthProvidersRoute.options.server?.handlers as {
	GET: () => Promise<Response> | Response;
};

const envKeys = [
	"AUTH_GOOGLE_ID",
	"AUTH_GOOGLE_SECRET",
	"AUTH_GITHUB_ID",
	"AUTH_GITHUB_SECRET",
	"AUTH_DISCORD_ID",
	"AUTH_DISCORD_SECRET",
	"DISABLE_REGISTRATION",
	"DISABLE_EMAIL_PASSWORD_REGISTRATION",
	"OIDC_1_PROVIDER_ID",
	"OIDC_1_PROVIDER_NAME",
	"OIDC_1_CLIENT_ID",
	"OIDC_1_CLIENT_SECRET",
	"OIDC_1_ISSUER",
	"OIDC_1_ALLOW_ACCOUNT_CREATION",
	"OIDC_1_SCOPES",
	"OIDC_2_PROVIDER_ID",
	"OIDC_2_PROVIDER_NAME",
	"OIDC_2_CLIENT_ID",
	"OIDC_2_CLIENT_SECRET",
	"OIDC_2_ISSUER",
	"OIDC_2_ALLOW_ACCOUNT_CREATION",
	"OIDC_2_SCOPES",
];

const originalEnv = new Map<string, string | undefined>();

beforeEach(() => {
	vi.clearAllMocks();
	for (const key of envKeys) {
		originalEnv.set(key, process.env[key]);
		delete process.env[key];
	}
	mocks.isEmailPasswordRegistrationAllowedForBootstrapState.mockReturnValue(
		true,
	);
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
		process.env.AUTH_GITHUB_ID = "github_id";
		process.env.AUTH_GITHUB_SECRET = "github_secret";
		process.env.AUTH_DISCORD_ID = "discord_id";
		process.env.AUTH_DISCORD_SECRET = "discord_secret";
		process.env.DISABLE_EMAIL_PASSWORD_REGISTRATION = "true";
		process.env.OIDC_1_PROVIDER_ID = "authentik";
		process.env.OIDC_1_PROVIDER_NAME = "Authentik";
		process.env.OIDC_1_CLIENT_ID = "oidc_client";
		process.env.OIDC_1_CLIENT_SECRET = "oidc_secret";
		process.env.OIDC_1_ISSUER = "https://issuer.example.com";
		process.env.OIDC_1_ALLOW_ACCOUNT_CREATION = "true";
		process.env.OIDC_2_PROVIDER_ID = "authelia";
		process.env.OIDC_2_PROVIDER_NAME = "Authelia";
		process.env.OIDC_2_CLIENT_ID = "oidc_client_two";
		process.env.OIDC_2_CLIENT_SECRET = "oidc_secret_two";
		process.env.OIDC_2_ISSUER = "https://issuer-two.example.com";
		process.env.OIDC_2_ALLOW_ACCOUNT_CREATION = "false";

		const response = await handlers.GET();
		const bodyText = await response.clone().text();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			emailPassword: {
				signInEnabled: true,
				registrationEnabled: true,
			},
			bootstrapAvailable: false,
			providers: [
				{
					id: "google",
					name: "Google",
					type: "social",
				},
				{
					id: "github",
					name: "GitHub",
					type: "social",
				},
				{
					id: "discord",
					name: "Discord",
					type: "social",
				},
				{
					id: "authentik",
					name: "Authentik",
					type: "oidc",
					allowAccountCreation: true,
				},
				{
					id: "authelia",
					name: "Authelia",
					type: "oidc",
					allowAccountCreation: false,
				},
			],
		});
		expect(mocks.isFirstUserBootstrapAvailable).toHaveBeenCalledTimes(1);
		expect(
			mocks.isEmailPasswordRegistrationAllowedForBootstrapState,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				registration: {
					disableAll: false,
					disableEmailPassword: true,
				},
				socialProviders: expect.objectContaining({
					google: expect.objectContaining({ clientId: "google_id" }),
					github: expect.objectContaining({ clientId: "github_id" }),
					discord: expect.objectContaining({ clientId: "discord_id" }),
				}),
				oidcProviders: expect.arrayContaining([
					expect.objectContaining({
						providerId: "authentik",
						displayName: "Authentik",
						allowAccountCreation: true,
					}),
					expect.objectContaining({
						providerId: "authelia",
						displayName: "Authelia",
						allowAccountCreation: false,
					}),
				]),
			}),
			false,
		);
		expect(bodyText).not.toContain("google_secret");
		expect(bodyText).not.toContain("github_secret");
		expect(bodyText).not.toContain("discord_secret");
		expect(bodyText).not.toContain("oidc_client");
		expect(bodyText).not.toContain("oidc_secret");
		expect(bodyText).not.toContain("https://issuer.example.com");
		expect(bodyText).not.toContain("oidc_client_two");
		expect(bodyText).not.toContain("oidc_secret_two");
		expect(bodyText).not.toContain("https://issuer-two.example.com");
	});

	it("returns registration and bootstrap status from auth policy", async () => {
		mocks.isEmailPasswordRegistrationAllowedForBootstrapState.mockReturnValueOnce(
			false,
		);
		mocks.isFirstUserBootstrapAvailable.mockResolvedValueOnce(true);

		const response = await handlers.GET();

		await expect(response.json()).resolves.toMatchObject({
			emailPassword: {
				signInEnabled: true,
				registrationEnabled: false,
			},
			bootstrapAvailable: true,
		});
		expect(mocks.isFirstUserBootstrapAvailable).toHaveBeenCalledTimes(1);
		expect(
			mocks.isEmailPasswordRegistrationAllowedForBootstrapState,
		).toHaveBeenCalledWith(expect.any(Object), true);
	});
});
