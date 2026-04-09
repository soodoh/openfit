import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAdmin: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	updateReturning: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		userProfiles: {
			id: "user_profiles.id",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		update: mocks.update,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAdmin: mocks.requireAdmin,
}));

import AdminUsersDetailRoute from "@/routes/api/admin/users.$id";

const handlers = AdminUsersDetailRoute.options.server?.handlers as {
	PATCH: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

describe("PATCH /api/admin/users/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
		mocks.update.mockReturnValue({
			set: mocks.updateSet,
		});
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockReturnValue({
			returning: mocks.updateReturning,
		});
		mocks.updateReturning.mockResolvedValue([
			{
				id: "profile_1",
				userId: "user_1",
				role: "ADMIN",
			},
		]);
	});

	it("returns the auth response when admin access is denied", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/users/profile_1", {
				method: "PATCH",
				body: JSON.stringify({ role: "ADMIN" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "profile_1" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid role payload", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/users/profile_1", {
				method: "PATCH",
				body: JSON.stringify({ role: "ROOT" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "profile_1" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 404 when the user profile is not found", async () => {
		mocks.updateReturning.mockResolvedValue([]);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/users/profile_missing", {
				method: "PATCH",
				body: JSON.stringify({ role: "ADMIN" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "profile_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "User not found" });
		expect(mocks.updateSet).toHaveBeenCalledWith({ role: "ADMIN" });
		expect(mocks.eq).toHaveBeenCalledWith(
			mocks.schema.userProfiles.id,
			"profile_missing",
		);
	});

	it("updates the role and returns the updated profile", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/users/profile_1", {
				method: "PATCH",
				body: JSON.stringify({ role: "ADMIN" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "profile_1" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "profile_1",
			userId: "user_1",
			role: "ADMIN",
		});
		expect(mocks.update).toHaveBeenCalledWith(mocks.schema.userProfiles);
		expect(mocks.updateSet).toHaveBeenCalledWith({ role: "ADMIN" });
		expect(mocks.updateReturning).toHaveBeenCalled();
	});

	it("returns 500 when an unexpected update error occurs", async () => {
		mocks.update.mockImplementationOnce(() => {
			throw new Error("boom");
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/users/profile_1", {
				method: "PATCH",
				body: JSON.stringify({ role: "ADMIN" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "profile_1" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update user",
		});
	});
});
