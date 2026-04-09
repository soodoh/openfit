import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstWorkoutSetGroup: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		workoutSetGroups: {
			id: "workout_set_groups.id",
			userId: "workout_set_groups.user_id",
			type: "workout_set_groups.type",
			comment: "workout_set_groups.comment",
			updatedAt: "workout_set_groups.updated_at",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			workoutSetGroups: {
				findFirst: mocks.findFirstWorkoutSetGroup,
			},
		},
		update: mocks.update,
		delete: mocks.delete,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAuth: mocks.requireAuth,
}));

import SetGroupDetailRoute from "@/routes/api/set-groups.$id";

const handlers = SetGroupDetailRoute.options.server?.handlers as {
	PATCH: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

describe("PATCH /api/set-groups/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.update.mockReturnValue({ set: mocks.updateSet });
		mocks.updateSet.mockReturnValue({ where: mocks.updateWhere });
		mocks.updateWhere.mockResolvedValue(undefined);
	});

	it("returns the auth response when authorization fails", async () => {
		const authResponse = Response.json({ error: "Nope" }, { status: 401 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "PATCH",
				body: JSON.stringify({ type: "SUPERSET" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Nope" });
	});

	it("falls back to a generic 401 when auth throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("auth failed"));

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "PATCH",
				body: JSON.stringify({ type: "SUPERSET" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 400 when the update payload is empty", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "PATCH",
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
				issues: [
					expect.objectContaining({
						message: "At least one field must be provided",
					}),
				],
			}),
		);
	});

	it("returns 404 when the set group does not exist", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue(null);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/set-groups/group_missing", {
				method: "PATCH",
				body: JSON.stringify({ type: "SUPERSET" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "group_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Set group not found",
		});
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 403 when updating another user's set group", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_other",
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "PATCH",
				body: JSON.stringify({ type: "SUPERSET" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("updates only the fields present in the request body", async () => {
		mocks.findFirstWorkoutSetGroup
			.mockResolvedValueOnce({
				id: "group_123",
				userId: "user_123",
			})
			.mockResolvedValueOnce({
				id: "group_123",
				userId: "user_123",
				type: "SUPERSET",
				comment: "Upper body day",
			});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "PATCH",
				body: JSON.stringify({
					type: "SUPERSET",
					comment: "Upper body day",
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "group_123",
				comment: "Upper body day",
			}),
		);
		expect(mocks.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "SUPERSET",
				comment: "Upper body day",
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("returns 500 for unexpected update failures", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
		});
		mocks.updateWhere.mockRejectedValue(new Error("boom"));

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "PATCH",
				body: JSON.stringify({ type: "SUPERSET" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update set group",
		});
	});
});

describe("DELETE /api/set-groups/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.delete.mockReturnValue({ where: mocks.deleteWhere });
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("returns the auth response when authorization fails", async () => {
		const authResponse = Response.json({ error: "Nope" }, { status: 401 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "DELETE",
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Nope" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("falls back to a generic 401 when auth throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("auth failed"));

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "DELETE",
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 404 when the set group does not exist", async () => {
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstWorkoutSetGroup.mockResolvedValue(null);

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/set-groups/group_missing", {
				method: "DELETE",
			}),
			params: { id: "group_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Set group not found",
		});
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("returns 403 when deleting another user's set group", async () => {
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_other",
		});

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "DELETE",
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("deletes the set group when the owner requests it", async () => {
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
		});

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "DELETE",
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.deleteWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.workoutSetGroups.id,
			right: "group_123",
		});
	});

	it("returns 500 for unexpected delete failures", async () => {
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
		});
		mocks.deleteWhere.mockRejectedValue(new Error("boom"));

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/set-groups/group_123", {
				method: "DELETE",
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to delete set group",
		});
	});
});
