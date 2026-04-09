import { describe, expect, it } from "vitest";
import { getOidcProviderConfig, getSocialProviderConfigs } from "./auth-config";

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

describe("getOidcProviderConfig", () => {
	it("returns null when any required field is missing", () => {
		expect(
			getOidcProviderConfig({
				AUTH_OIDC_CLIENT_ID: "client-id",
				AUTH_OIDC_CLIENT_SECRET: "client-secret",
			}),
		).toBeNull();
	});

	it("builds the discovery URL when configuration is complete", () => {
		expect(
			getOidcProviderConfig({
				AUTH_OIDC_CLIENT_ID: "client-id",
				AUTH_OIDC_CLIENT_SECRET: "client-secret",
				AUTH_OIDC_ISSUER: "https://auth.example.com",
			}),
		).toEqual({
			clientId: "client-id",
			clientSecret: "client-secret",
			discoveryUrl: "https://auth.example.com/.well-known/openid-configuration",
			scopes: ["openid", "email", "profile"],
			pkce: true,
		});
	});

	it("trims OIDC credentials before building the config", () => {
		expect(
			getOidcProviderConfig({
				AUTH_OIDC_CLIENT_ID: " client-id ",
				AUTH_OIDC_CLIENT_SECRET: " client-secret ",
				AUTH_OIDC_ISSUER: " https://auth.example.com ",
			}),
		).toEqual({
			clientId: "client-id",
			clientSecret: "client-secret",
			discoveryUrl: "https://auth.example.com/.well-known/openid-configuration",
			scopes: ["openid", "email", "profile"],
			pkce: true,
		});
	});
});
