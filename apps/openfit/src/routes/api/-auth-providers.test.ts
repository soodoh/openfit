import { afterEach, beforeEach, describe, expect, it } from "vitest";

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
	"AUTH_OIDC_CLIENT_ID",
	"AUTH_OIDC_CLIENT_SECRET",
	"AUTH_OIDC_ISSUER",
];

const originalEnv = new Map<string, string | undefined>();

beforeEach(() => {
	for (const key of envKeys) {
		originalEnv.set(key, process.env[key]);
		delete process.env[key];
	}
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
	it("returns provider availability based on the configured environment variables", async () => {
		process.env.AUTH_GOOGLE_ID = "google_id";
		process.env.AUTH_GOOGLE_SECRET = "google_secret";
		process.env.AUTH_GITHUB_ID = "github_id";
		process.env.AUTH_DISCORD_SECRET = "discord_secret";
		process.env.AUTH_OIDC_CLIENT_ID = "oidc_client";
		process.env.AUTH_OIDC_CLIENT_SECRET = "oidc_secret";
		process.env.AUTH_OIDC_ISSUER = "https://issuer.example.com";

		const response = await handlers.GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			google: true,
			github: false,
			discord: false,
			oidc: true,
		});
	});
});
