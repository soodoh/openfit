import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthConfig } from "@/lib/auth-config";
import { AuthProviderStatusSchema } from "@/lib/auth-provider-status";
import { createRegistrationPolicy } from "./auth-policy";

const providerEnv = {
	AUTH_GOOGLE_ID: "google-client",
	AUTH_GOOGLE_SECRET: "google-secret",
	OIDC_1_PROVIDER_ID: "closed",
	OIDC_1_CLIENT_ID: "closed-client",
	OIDC_1_CLIENT_SECRET: "closed-secret",
	OIDC_1_ISSUER: "https://closed.example",
	OIDC_2_PROVIDER_ID: "open",
	OIDC_2_PROVIDER_NAME: "Company login",
	OIDC_2_CLIENT_ID: "open-client",
	OIDC_2_CLIENT_SECRET: "open-secret",
	OIDC_2_ISSUER: "https://open.example",
	OIDC_2_ALLOW_ACCOUNT_CREATION: "true",
};
let sqlite: DatabaseSync;
let bootstrap: ReturnType<typeof vi.fn<() => Promise<boolean>>>;

function policy(env: Record<string, string> = {}) {
	return createRegistrationPolicy(
		getAuthConfig({ ...providerEnv, ...env }),
		bootstrap,
	);
}
function request(path: string, body?: unknown) {
	return new Request(`http://localhost/api/auth/${path}`, {
		method: "POST",
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
}

describe("registration policy interface with real SQLite state", () => {
	beforeEach(() => {
		sqlite = new DatabaseSync(":memory:");
		sqlite.exec("create table users (id text primary key)");
		bootstrap = vi.fn(
			async () => !sqlite.prepare("select id from users limit 1").get(),
		);
	});
	afterEach(() => sqlite.close());

	it.each([
		{
			global: "false",
			email: "false",
			existing: true,
			emailAllowed: true,
			socialAllowed: true,
			oidcAllowed: false,
		},
		{
			global: "false",
			email: "true",
			existing: true,
			emailAllowed: false,
			socialAllowed: true,
			oidcAllowed: false,
		},
		{
			global: "true",
			email: "false",
			existing: true,
			emailAllowed: false,
			socialAllowed: false,
			oidcAllowed: false,
		},
		{
			global: "true",
			email: "true",
			existing: true,
			emailAllowed: false,
			socialAllowed: false,
			oidcAllowed: false,
		},
		{
			global: "true",
			email: "true",
			existing: false,
			emailAllowed: true,
			socialAllowed: true,
			oidcAllowed: true,
		},
	])(
		"keeps status, preflight and creation consistent for %j",
		async (scenario) => {
			if (scenario.existing)
				sqlite.exec("insert into users values ('existing')");
			const module = policy({
				DISABLE_REGISTRATION: scenario.global,
				DISABLE_EMAIL_PASSWORD_REGISTRATION: scenario.email,
			});
			const status = await module.getProviderStatus();
			expect(status.emailPassword.registrationEnabled).toBe(
				scenario.emailAllowed,
			);
			expect(status.bootstrapAvailable).toBe(!scenario.existing);
			expect(AuthProviderStatusSchema.safeParse(status).success).toBe(true);
			expect(
				(await module.checkRequest(request("sign-up/email"))) === null,
			).toBe(scenario.emailAllowed);
			expect(
				(await module.checkUserCreation({ path: "/sign-up/email" })) === null,
			).toBe(scenario.emailAllowed);
			for (const [provider, allowed] of [
				["google", scenario.socialAllowed],
				["closed", scenario.oidcAllowed],
				["open", true],
			] as const) {
				expect(
					(await module.checkRequest(
						request("sign-in/social", { provider, requestSignUp: true }),
					)) === null,
				).toBe(allowed);
				expect(
					(await module.checkUserCreation({
						path: "/sign-in/social",
						body: { provider },
					})) === null,
				).toBe(allowed);
				expect(
					(await module.checkUserCreation({
						path: "/callback/:id",
						params: { id: provider },
					})) === null,
				).toBe(allowed);
				expect(
					status.providers.find((item) => item.id === provider)?.requestSignUp,
				).toBe(!scenario.existing);
			}
		},
	);

	it("snapshots configuration without snapshotting database state", async () => {
		sqlite.exec("insert into users values ('existing')");
		const config = getAuthConfig({
			...providerEnv,
			DISABLE_REGISTRATION: "true",
		});
		const module = createRegistrationPolicy(config, bootstrap);
		config.registration.disableAll = false;
		config.oidcProviders[0].allowAccountCreation = true;
		expect(
			await module.checkRequest(
				request("sign-in/social", { provider: "google", requestSignUp: true }),
			),
		).not.toBeNull();
		expect(
			await module.checkUserCreation({
				path: "/callback/:id",
				params: { id: "closed" },
			}),
		).not.toBeNull();
		expect(
			(await module.getProviderStatus()).emailPassword.registrationEnabled,
		).toBe(false);
	});

	it("rechecks bootstrap after an allowed request rather than caching permission", async () => {
		const module = policy({ DISABLE_REGISTRATION: "true" });
		expect(await module.checkRequest(request("sign-up/email"))).toBeNull();
		sqlite.exec("insert into users values ('first')");
		expect(await module.checkUserCreation({ path: "/sign-up/email" })).toEqual({
			message: "Email/password registration is disabled",
		});
		expect(
			(await module.getProviderStatus()).emailPassword.registrationEnabled,
		).toBe(false);
	});

	it("does not turn registration restrictions into existing-user sign-in restrictions", async () => {
		sqlite.exec("insert into users values ('existing')");
		const module = policy({ DISABLE_REGISTRATION: "true" });
		expect(
			await module.checkRequest(
				request("sign-in/social", { provider: "google" }),
			),
		).toBeNull();
		expect(
			await module.checkRequest(
				request("sign-in/email", { email: "a@example.com" }),
			),
		).toBeNull();
		expect(
			await module.checkRequest(
				new Request("http://localhost/api/auth/callback/google"),
			),
		).toBeNull();
		expect(bootstrap).not.toHaveBeenCalled();
	});

	it.each([
		undefined,
		null,
		[],
		"invalid",
		{},
		{ path: 42 },
		{ path: "/unknown" },
		{ path: "/callback/unrecognized" },
		{ path: "/sign-in/social", body: null },
		{ path: "/sign-in/social", body: { provider: "missing" } },
		{ path: "/callback/:id", params: {} },
	])("fails closed for unclassified creation origin %j", async (context) => {
		expect(await policy().checkUserCreation(context)).toEqual({
			message: "Account creation origin is not recognized",
		});
		expect(bootstrap).not.toHaveBeenCalled();
	});

	it("fails closed for an unknown explicit signup provider, even during bootstrap", async () => {
		expect(
			await policy().checkRequest(
				request("sign-in/social", { provider: "missing", requestSignUp: true }),
			),
		).not.toBeNull();
		expect(bootstrap).not.toHaveBeenCalled();
	});

	it.each(["{", "null", "[]", "42"])(
		"leaves malformed sign-in validation to Better Auth (%s), without consuming the request",
		async (body) => {
			const input = new Request("http://localhost/api/auth/sign-in/social", {
				method: "POST",
				body,
			});
			expect(await policy().checkRequest(input)).toBeNull();
			expect(await input.text()).toBe(body);
			expect(bootstrap).not.toHaveBeenCalled();
		},
	);

	it("preserves the forwarded JSON body and does not need a content-type header", async () => {
		const input = request("sign-in/social", {
			provider: "open",
			requestSignUp: true,
		});
		expect(
			await policy({ DISABLE_REGISTRATION: "true" }).checkRequest(input),
		).toBeNull();
		expect(await input.json()).toEqual({
			provider: "open",
			requestSignUp: true,
		});
		expect(bootstrap).not.toHaveBeenCalled();
	});

	it("avoids database reads for open gates and opted-in OIDC providers", async () => {
		const module = policy();
		await module.checkUserCreation({ path: "/sign-up/email" });
		await module.checkUserCreation({
			path: "/callback/:id",
			params: { id: "google" },
		});
		await module.checkUserCreation({
			path: "/callback/:id",
			params: { id: "open" },
		});
		expect(bootstrap).not.toHaveBeenCalled();
	});

	it("returns safe provider status with one consistent bootstrap observation", async () => {
		const status = await policy({
			DISABLE_REGISTRATION: "true",
		}).getProviderStatus();
		expect(bootstrap).toHaveBeenCalledTimes(1);
		const json = JSON.stringify(status);
		for (const secret of [
			"google-client",
			"google-secret",
			"closed-client",
			"closed-secret",
			"https://closed.example",
			"open-client",
			"open-secret",
		])
			expect(json).not.toContain(secret);
		expect(status.providers.find((item) => item.id === "open")?.name).toBe(
			"Company login",
		);
	});

	it("uses the first configured OIDC match when provider IDs repeat, like Better Auth", async () => {
		sqlite.exec("insert into users values ('existing')");
		const module = policy({
			OIDC_2_PROVIDER_ID: "closed",
			DISABLE_REGISTRATION: "true",
		});
		expect(
			await module.checkRequest(
				request("sign-in/social", { provider: "closed", requestSignUp: true }),
			),
		).not.toBeNull();
		expect(
			await module.checkUserCreation({
				path: "/callback/:id",
				params: { id: "closed" },
			}),
		).not.toBeNull();
		const providers = (await module.getProviderStatus()).providers.filter(
			(item) => item.id === "closed",
		);
		expect(providers).toHaveLength(1);
		expect(providers[0].allowAccountCreation).toBe(false);
	});

	it("uses OIDC identity when an OIDC provider shadows a social provider", async () => {
		sqlite.exec("insert into users values ('existing')");
		const module = policy({
			OIDC_2_PROVIDER_ID: "google",
			DISABLE_REGISTRATION: "true",
		});
		expect(
			await module.checkRequest(
				request("sign-in/social", { provider: "google", requestSignUp: true }),
			),
		).toBeNull();
		expect(
			(await module.getProviderStatus()).providers.filter(
				(item) => item.id === "google",
			),
		).toHaveLength(1);
	});
});
