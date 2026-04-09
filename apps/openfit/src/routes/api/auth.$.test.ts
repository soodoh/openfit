import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	authHandler: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	auth: {
		handler: mocks.authHandler,
	},
}));

import AuthRoute from "@/routes/api/auth.$";

const handlers = AuthRoute.options.server?.handlers as {
	GET: ({ request }: { request: Request }) => Promise<Response>;
	POST: ({ request }: { request: Request }) => Promise<Response>;
};

describe("api/auth/$", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	for (const method of ["GET", "POST"] as const) {
		it(`delegates ${method} to auth.handler and returns its response`, async () => {
			const request = new Request(`http://localhost/api/auth/${method}`);
			const responseFromAuth = new Response(`${method} ok`, { status: 207 });
			mocks.authHandler.mockResolvedValueOnce(responseFromAuth);

			const response = await handlers[method]({ request });

			expect(mocks.authHandler).toHaveBeenCalledWith(request);
			expect(response).toBe(responseFromAuth);
			expect(response.status).toBe(207);
			expect(await response.text()).toBe(`${method} ok`);
		});
	}
});
