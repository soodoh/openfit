import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstUserProfile: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		userProfiles: {
			userId: "user_profiles.user_id",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			userProfiles: {
				findFirst: mocks.findFirstUserProfile,
			},
		},
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAuth: mocks.requireAuth,
}));

import AdminCheckRoute from "@/routes/api/admin/check";

const handlers = AdminCheckRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/admin/check", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "admin_123" } });
		mocks.findFirstUserProfile.mockResolvedValue(null);
	});

	it("returns the auth response when auth fails with a response", async () => {
		mocks.requireAuth.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/check"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.findFirstUserProfile).not.toHaveBeenCalled();
	});

	it("returns isAdmin false when auth throws a non-response error", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/check"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ isAdmin: false });
		expect(mocks.findFirstUserProfile).not.toHaveBeenCalled();
	});

	it("returns true when the current profile is an admin", async () => {
		mocks.findFirstUserProfile.mockResolvedValue({
			role: "ADMIN",
		});

		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/check"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ isAdmin: true });
		expect(mocks.eq).toHaveBeenCalledWith(
			mocks.schema.userProfiles.userId,
			"admin_123",
		);
	});

	it("returns false when the current profile is missing or not an admin", async () => {
		mocks.findFirstUserProfile.mockResolvedValue({
			role: "USER",
		});

		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/check"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ isAdmin: false });
	});
});
