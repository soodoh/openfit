import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	authHandler: vi.fn(),
	checkRequest: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: { handler: mocks.authHandler } }));
vi.mock("@/lib/auth-policy", () => ({
	registrationPolicy: { checkRequest: mocks.checkRequest },
}));

import AuthRoute from "@/routes/api/auth.$";

const handlers = AuthRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
	POST: (args: { request: Request }) => Promise<Response>;
};

describe("auth request adapter", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.checkRequest.mockResolvedValue(null);
		mocks.authHandler.mockResolvedValue(
			new Response("auth ok", { status: 207 }),
		);
	});
	it("delegates GET without a signup preflight", async () => {
		const request = new Request("http://localhost/api/auth/get-session");
		expect((await handlers.GET({ request })).status).toBe(207);
		expect(mocks.checkRequest).not.toHaveBeenCalled();
		expect(mocks.authHandler).toHaveBeenCalledWith(request);
	});
	it("forwards the same allowed request", async () => {
		const request = new Request("http://localhost/api/auth/sign-in/social", {
			method: "POST",
			body: "{}",
		});
		expect((await handlers.POST({ request })).status).toBe(207);
		expect(mocks.checkRequest).toHaveBeenCalledWith(request);
		expect(mocks.authHandler).toHaveBeenCalledWith(request);
	});
	it("translates the policy denial without dispatching auth", async () => {
		mocks.checkRequest.mockResolvedValue({
			message: "Email/password registration is disabled",
		});
		const response = await handlers.POST({
			request: new Request("http://localhost/api/auth/sign-up/email", {
				method: "POST",
			}),
		});
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			error: "Email/password registration is disabled",
		});
		expect(mocks.authHandler).not.toHaveBeenCalled();
	});
});
