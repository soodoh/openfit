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
					id: "authentik",
					name: "Authentik",
					type: "oidc",
					allowAccountCreation: true,
				},
			],
		});
		expect(bodyText).not.toContain("google_secret");
		expect(bodyText).not.toContain("oidc_client");
		expect(bodyText).not.toContain("oidc_secret");
		expect(bodyText).not.toContain("https://issuer.example.com");
	});

	it("returns registration and bootstrap status from auth policy", async () => {
		mocks.isEmailPasswordRegistrationAllowed.mockResolvedValueOnce(false);
		mocks.isFirstUserBootstrapAvailable.mockResolvedValueOnce(true);

		const response = await handlers.GET();

		await expect(response.json()).resolves.toMatchObject({
			emailPassword: {
				signInEnabled: true,
				registrationEnabled: false,
			},
			bootstrapAvailable: true,
		});
	});
});
