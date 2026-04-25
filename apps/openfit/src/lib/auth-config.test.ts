import { describe, expect, it } from "vitest";
import { getAuthConfig, getSocialProviderConfigs } from "./auth-config";

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
				discoveryUrl:
					"https://auth.example.com/.well-known/openid-configuration",
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
				discoveryUrl:
					"https://sso.example.com/.well-known/openid-configuration",
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
