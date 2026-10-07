import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

const fixture = vi.hoisted(() => ({
	sqlite: undefined as DatabaseSync | undefined,
}));

// Replace only the SQLite runtime adapter, not configuration, policy, routes, or Better Auth.
// The production migrations and schema run against a disposable native SQLite database.
vi.mock("@/db", async () => {
	const { DatabaseSync } = await import("node:sqlite");
	const { readFileSync, readdirSync } = await import("node:fs");
	const { drizzle } = await import("drizzle-orm/sqlite-proxy");
	const { schema } = await import("@/db/schema");
	const sqlite = new DatabaseSync(":memory:");
	fixture.sqlite = sqlite;
	const migrations = new URL("../../db/migrations/", import.meta.url);
	for (const name of readdirSync(migrations)
		.filter((name) => name.endsWith(".sql"))
		.sort()) {
		sqlite.exec(readFileSync(new URL(name, migrations), "utf8"));
	}
	sqlite.exec("PRAGMA foreign_keys=ON");
	const db = drizzle(
		async (sql, params, method) => {
			const statement = sqlite.prepare(sql);
			const values = params as SQLInputValue[];
			if (method === "run") {
				statement.run(...values);
				return { rows: [] };
			}
			statement.setReturnArrays(true);
			const rows =
				method === "get" ? statement.get(...values) : statement.all(...values);
			return { rows: rows as unknown as unknown[] };
		},
		{ schema },
	);
	return { db };
});

const baseURL = "http://localhost:3000";
const credentials = {
	email: "first@example.com",
	password: "Password1!",
	name: "First user",
};
function request(path: string, body: unknown) {
	return new Request(`${baseURL}/api/auth/${path}`, {
		method: "POST",
		headers: { "content-type": "application/json", origin: baseURL },
		body: JSON.stringify(body),
	});
}
async function load() {
	const { auth } = await import("@/lib/auth");
	const { registrationPolicy } = await import("@/lib/auth-policy");
	const { Route } = await import("@/routes/api/auth.$");
	const handlers = Route.options.server?.handlers as {
		POST: (args: { request: Request }) => Promise<Response>;
	};
	return { auth, registrationPolicy, handlers };
}
function identityProvider(allowAccountCreation: boolean) {
	vi.stubEnv("OIDC_1_PROVIDER_ID", "company");
	vi.stubEnv("OIDC_1_CLIENT_ID", "test-client");
	vi.stubEnv("OIDC_1_CLIENT_SECRET", "test-client-secret");
	vi.stubEnv("OIDC_1_ISSUER", "https://identity.example");
	vi.stubEnv("OIDC_1_ALLOW_ACCOUNT_CREATION", String(allowAccountCreation));
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: string | URL | Request) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.href
						: input.url;
			if (url === "https://identity.example/.well-known/openid-configuration")
				return Response.json({
					issuer: "https://identity.example",
					authorization_endpoint: "https://identity.example/authorize",
					token_endpoint: "https://identity.example/token",
					userinfo_endpoint: "https://identity.example/userinfo",
				});
			if (url === "https://identity.example/token")
				return Response.json({
					access_token: "test-access",
					token_type: "Bearer",
				});
			if (url === "https://identity.example/userinfo")
				return Response.json({
					id: "oidc-user",
					sub: "oidc-user",
					name: "OIDC user",
					email: "oidc@example.com",
					email_verified: true,
				});
			throw new Error(`Unexpected external fetch: ${url}`);
		}),
	);
}
async function callback(
	auth: Awaited<ReturnType<typeof load>>["auth"],
	initiation: Response,
) {
	const payload = (await initiation.json()) as { url: string };
	const state = new URL(payload.url).searchParams.get("state");
	const cookie = initiation.headers
		.getSetCookie()
		.map((value) => value.split(";", 1)[0])
		.join("; ");
	return auth.handler(
		new Request(
			`${baseURL}/api/auth/callback/company?state=${encodeURIComponent(state ?? "")}&code=test-code`,
			{ headers: { cookie } },
		),
	);
}

describe("registration through real Better Auth and SQLite", () => {
	beforeEach(() => {
		vi.resetModules();
		fixture.sqlite?.exec("delete from users; delete from verifications");
		for (const key of Object.keys(process.env).filter(
			(key) => key.startsWith("AUTH_") || /^OIDC_\d+_/.test(key),
		))
			vi.stubEnv(key, "");
		vi.stubEnv("DISABLE_REGISTRATION", "true");
		vi.stubEnv("DISABLE_EMAIL_PASSWORD_REGISTRATION", "true");
		vi.stubEnv("BETTER_AUTH_BASE_URL", baseURL);
		vi.stubEnv(
			"BETTER_AUTH_SECRET",
			"test-only-secret-that-is-at-least-thirty-two-characters",
		);
	});
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});
	afterAll(() => fixture.sqlite?.close());

	it("creates the bootstrap ADMIN, closes registration, and preserves existing-user sign-in", async () => {
		const { auth, registrationPolicy, handlers } = await load();
		expect(
			(await registrationPolicy.getProviderStatus()).bootstrapAvailable,
		).toBe(true);
		const first = await handlers.POST({
			request: request("sign-up/email", credentials),
		});
		expect(first.status).toBe(200);
		expect(
			fixture.sqlite?.prepare("select role from user_profiles").get(),
		).toMatchObject({ role: "ADMIN" });
		expect(
			(await registrationPolicy.getProviderStatus()).emailPassword
				.registrationEnabled,
		).toBe(false);
		const second = await handlers.POST({
			request: request("sign-up/email", {
				...credentials,
				email: "second@example.com",
			}),
		});
		expect(second.status).toBe(403);
		await expect(
			auth.api.signUpEmail({
				body: { ...credentials, email: "direct@example.com" },
			}),
		).rejects.toThrow("Email/password registration is disabled");
		const signIn = await handlers.POST({
			request: request("sign-in/email", credentials),
		});
		expect(signIn.status).toBe(200);
		expect(
			fixture.sqlite?.prepare("select count(*) as total from users").get(),
		).toMatchObject({ total: 1 });
	});

	it("allows the seed-style direct signup but rejects unclassified internal creation", async () => {
		const { auth } = await load();
		const context = await auth.$context;
		await expect(
			context.internalAdapter.createUser(
				{
					name: "Unknown",
					email: "unknown@example.com",
					emailVerified: false,
				},
				{ method: "admin" },
			),
		).rejects.toThrow("Account creation origin is not recognized");
		expect(
			fixture.sqlite?.prepare("select count(*) as total from users").get(),
		).toMatchObject({ total: 0 });
		const created = await auth.api.signUpEmail({ body: credentials });
		expect(created.user.email).toBe(credentials.email);
		expect(
			fixture.sqlite?.prepare("select role from user_profiles").get(),
		).toMatchObject({ role: "ADMIN" });
	});

	it("uses the startup configuration consistently even if the environment later changes", async () => {
		const { handlers, registrationPolicy } = await load();
		expect(
			(await handlers.POST({ request: request("sign-up/email", credentials) }))
				.status,
		).toBe(200);
		vi.stubEnv("DISABLE_REGISTRATION", "false");
		vi.stubEnv("DISABLE_EMAIL_PASSWORD_REGISTRATION", "false");
		expect(
			(await registrationPolicy.getProviderStatus()).emailPassword
				.registrationEnabled,
		).toBe(false);
		expect(
			(
				await handlers.POST({
					request: request("sign-up/email", {
						...credentials,
						email: "later@example.com",
					}),
				})
			).status,
		).toBe(403);
	});

	it("honors OIDC opt-in through the current social initiation and callback paths after bootstrap", async () => {
		identityProvider(true);
		const { auth, handlers } = await load();
		expect(
			(await handlers.POST({ request: request("sign-up/email", credentials) }))
				.status,
		).toBe(200);
		const initiation = await handlers.POST({
			request: request("sign-in/social", {
				provider: "company",
				callbackURL: "/",
				requestSignUp: true,
			}),
		});
		expect(initiation.status).toBe(200);
		const completed = await callback(auth, initiation);
		expect(completed.status).toBe(302);
		expect(
			fixture.sqlite
				?.prepare("select email from users where email = 'oidc@example.com'")
				.get(),
		).toMatchObject({ email: "oidc@example.com" });
		expect(
			fixture.sqlite
				?.prepare(
					"select role from user_profiles join users on users.id = user_profiles.user_id where email = 'oidc@example.com'",
				)
				.get(),
		).toMatchObject({ role: "USER" });
	});

	it("bootstraps an OIDC ADMIN and permits its later sign-in with registration closed", async () => {
		identityProvider(false);
		const { auth, handlers } = await load();
		const first = await handlers.POST({
			request: request("sign-in/social", {
				provider: "company",
				callbackURL: "/",
				requestSignUp: true,
			}),
		});
		expect(first.status).toBe(200);
		const created = await callback(auth, first);
		expect(created.status).toBe(302);
		expect(
			new URL(created.headers.get("location") ?? "", baseURL).pathname,
		).toBe("/");
		expect(
			fixture.sqlite?.prepare("select role from user_profiles").get(),
		).toMatchObject({ role: "ADMIN" });
		const returning = await handlers.POST({
			request: request("sign-in/social", {
				provider: "company",
				callbackURL: "/",
			}),
		});
		expect(returning.status).toBe(200);
		const signedIn = await callback(auth, returning);
		expect(signedIn.status).toBe(302);
		expect(
			new URL(signedIn.headers.get("location") ?? "", baseURL).pathname,
		).toBe("/");
		expect(
			fixture.sqlite?.prepare("select count(*) as total from users").get(),
		).toMatchObject({ total: 1 });
	});

	it("rechecks a closed OIDC provider when bootstrap disappears between initiation and callback", async () => {
		identityProvider(false);
		const { auth, handlers } = await load();
		const initiation = await handlers.POST({
			request: request("sign-in/social", {
				provider: "company",
				callbackURL: "/",
				requestSignUp: true,
			}),
		});
		expect(initiation.status).toBe(200);
		expect(
			(await handlers.POST({ request: request("sign-up/email", credentials) }))
				.status,
		).toBe(200);
		await callback(auth, initiation);
		expect(
			fixture.sqlite?.prepare("select count(*) as total from users").get(),
		).toMatchObject({ total: 1 });
		expect(
			fixture.sqlite
				?.prepare("select email from users where email = 'oidc@example.com'")
				.get(),
		).toBeUndefined();
	});
});
