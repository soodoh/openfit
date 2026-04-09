import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstWorkoutSet: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		workoutSetGroups: {
			id: "workout_set_groups.id",
		},
		workoutSets: {
			id: "workout_sets.id",
			userId: "workout_sets.user_id",
			setGroupId: "workout_sets.set_group_id",
			type: "workout_sets.type",
			reps: "workout_sets.reps",
			repetitionUnitId: "workout_sets.repetition_unit_id",
			weight: "workout_sets.weight",
			weightUnitId: "workout_sets.weight_unit_id",
			restTime: "workout_sets.rest_time",
			completed: "workout_sets.completed",
			updatedAt: "workout_sets.updated_at",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			workoutSets: {
				findFirst: mocks.findFirstWorkoutSet,
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

import SetDetailRoute from "@/routes/api/sets.$id";

const handlers = SetDetailRoute.options.server?.handlers as {
	PATCH: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

describe("PATCH /api/sets/:id", () => {
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
			request: new Request("http://localhost/api/sets/set_123", {
				method: "PATCH",
				body: JSON.stringify({ type: "SUPERSET" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Nope" });
	});

	it("returns 400 when the update payload is empty", async () => {
		mocks.findFirstWorkoutSet.mockResolvedValue({
			id: "set_123",
			userId: "user_123",
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "PATCH",
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "set_123" },
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

	it("returns 404 when the set does not exist", async () => {
		mocks.findFirstWorkoutSet.mockResolvedValue(null);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sets/set_missing", {
				method: "PATCH",
				body: JSON.stringify({ type: "SUPERSET" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "set_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Set not found" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 403 when updating another user's set", async () => {
		mocks.findFirstWorkoutSet.mockResolvedValue({
			id: "set_123",
			userId: "user_other",
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "PATCH",
				body: JSON.stringify({ type: "SUPERSET" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("updates only the fields present in the request body", async () => {
		mocks.findFirstWorkoutSet
			.mockResolvedValueOnce({
				id: "set_123",
				userId: "user_123",
			})
			.mockResolvedValueOnce({
				id: "set_123",
				userId: "user_123",
				type: "SUPERSET",
				reps: 12,
				completed: true,
				exercise: { id: "exercise_1" },
				repetitionUnit: { id: "rep_unit" },
				weightUnit: { id: "weight_unit" },
			});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "PATCH",
				body: JSON.stringify({
					reps: 12,
					completed: true,
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "set_123",
				reps: 12,
				completed: true,
			}),
		);
		expect(mocks.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				reps: 12,
				completed: true,
				updatedAt: expect.any(Date),
			}),
		);
		expect(mocks.updateSet.mock.calls[0][0]).not.toHaveProperty("type");
		expect(mocks.updateSet.mock.calls[0][0]).not.toHaveProperty("weight");
	});

	it("returns 500 for unexpected update failures", async () => {
		mocks.findFirstWorkoutSet.mockResolvedValue({
			id: "set_123",
			userId: "user_123",
		});
		mocks.updateWhere.mockRejectedValue(new Error("boom"));

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "PATCH",
				body: JSON.stringify({ reps: 12 }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update set",
		});
	});
});

describe("DELETE /api/sets/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.delete.mockReturnValue({ where: mocks.deleteWhere });
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("falls back to a generic 401 when auth throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("auth failed"));

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "DELETE",
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 404 when the set does not exist", async () => {
		mocks.findFirstWorkoutSet.mockResolvedValue(null);

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sets/set_missing", {
				method: "DELETE",
			}),
			params: { id: "set_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Set not found" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("returns 403 when deleting another user's set", async () => {
		mocks.findFirstWorkoutSet.mockResolvedValue({
			id: "set_123",
			userId: "user_other",
		});

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "DELETE",
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("deletes the set group when removing the last set", async () => {
		mocks.findFirstWorkoutSet
			.mockResolvedValueOnce({
				id: "set_123",
				userId: "user_123",
				setGroupId: "group_123",
			})
			.mockResolvedValueOnce(null);

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "DELETE",
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			success: true,
			setGroupDeleted: true,
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(1, {
			type: "eq",
			left: mocks.schema.workoutSets.id,
			right: "set_123",
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(2, {
			type: "eq",
			left: mocks.schema.workoutSetGroups.id,
			right: "group_123",
		});
	});

	it("leaves the set group in place when other sets remain", async () => {
		mocks.findFirstWorkoutSet
			.mockResolvedValueOnce({
				id: "set_123",
				userId: "user_123",
				setGroupId: "group_123",
			})
			.mockResolvedValueOnce({
				id: "set_456",
				userId: "user_123",
				setGroupId: "group_123",
			});

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "DELETE",
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			success: true,
			setGroupDeleted: false,
		});
		expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
		expect(mocks.deleteWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.workoutSets.id,
			right: "set_123",
		});
	});

	it("returns 500 for unexpected delete failures", async () => {
		mocks.findFirstWorkoutSet.mockResolvedValue({
			id: "set_123",
			userId: "user_123",
			setGroupId: "group_123",
		});
		mocks.deleteWhere.mockRejectedValue(new Error("boom"));

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sets/set_123", {
				method: "DELETE",
			}),
			params: { id: "set_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to delete set",
		});
	});
});
