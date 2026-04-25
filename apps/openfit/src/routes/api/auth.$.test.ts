import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	authHandler: vi.fn(),
	getAuthConfig: vi.fn(),
	isEmailPasswordRegistrationAllowed: vi.fn(),
	canRequestOidcAccountCreation: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	auth: {
		handler: mocks.authHandler,
	},
}));

vi.mock("@/lib/auth-config", () => ({
	getAuthConfig: mocks.getAuthConfig,
}));

vi.mock("@/lib/auth-policy", () => ({
	isEmailPasswordRegistrationAllowed: mocks.isEmailPasswordRegistrationAllowed,
	canRequestOidcAccountCreation: mocks.canRequestOidcAccountCreation,
}));

import AuthRoute from "@/routes/api/auth.$";

const handlers = AuthRoute.options.server?.handlers as {
	GET: ({ request }: { request: Request }) => Promise<Response>;
	POST: ({ request }: { request: Request }) => Promise<Response>;
};

const config = {
	registration: {
		disableAll: false,
		disableEmailPassword: false,
	},
	emailPassword: {
		enabled: true as const,
	},
	socialProviders: {},
	oidcProviders: [],
};

describe("api/auth/$", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.getAuthConfig.mockReturnValue(config);
		mocks.isEmailPasswordRegistrationAllowed.mockResolvedValue(true);
		mocks.canRequestOidcAccountCreation.mockResolvedValue(true);
		mocks.authHandler.mockResolvedValue(
			new Response("auth ok", { status: 207 }),
		);
	});

	it("delegates GET to auth.handler", async () => {
		const request = new Request("http://localhost/api/auth/session");
		const response = await handlers.GET({ request });

		expect(mocks.authHandler).toHaveBeenCalledWith(request);
		expect(response.status).toBe(207);
		expect(await response.text()).toBe("auth ok");
	});

	it("blocks disabled email registration before auth.handler", async () => {
		mocks.isEmailPasswordRegistrationAllowed.mockResolvedValueOnce(false);
		const request = new Request("http://localhost/api/auth/sign-up/email", {
			method: "POST",
			body: JSON.stringify({
				email: "person@example.com",
				password: "Password1!",
				name: "person",
			}),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await handlers.POST({ request });

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({
			error: "Email/password registration is disabled",
		});
		expect(mocks.authHandler).not.toHaveBeenCalled();
	});

	it("allows email registration when policy allows it", async () => {
		const request = new Request("http://localhost/api/auth/sign-up/email", {
			method: "POST",
			body: JSON.stringify({
				email: "first@example.com",
				password: "Password1!",
				name: "first",
			}),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await handlers.POST({ request });

		expect(mocks.authHandler).toHaveBeenCalledWith(request);
		expect(response.status).toBe(207);
	});

	it("blocks OIDC requestSignUp when the provider cannot create accounts", async () => {
		mocks.canRequestOidcAccountCreation.mockResolvedValueOnce(false);
		const request = new Request("http://localhost/api/auth/sign-in/oauth2", {
			method: "POST",
			body: JSON.stringify({
				providerId: "authentik",
				callbackURL: "/",
				requestSignUp: true,
			}),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await handlers.POST({ request });

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({
			error: "Account creation is disabled for this OIDC provider",
		});
		expect(mocks.authHandler).not.toHaveBeenCalled();
	});

	it("delegates OIDC sign-in when requestSignUp is absent", async () => {
		const request = new Request("http://localhost/api/auth/sign-in/oauth2", {
			method: "POST",
			body: JSON.stringify({
				providerId: "authentik",
				callbackURL: "/",
			}),
			headers: {
				"content-type": "application/json",
			},
		});

		const response = await handlers.POST({ request });

		expect(mocks.canRequestOidcAccountCreation).not.toHaveBeenCalled();
		expect(mocks.authHandler).toHaveBeenCalledWith(request);
		expect(response.status).toBe(207);
	});
});
