import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstWorkoutSetGroup: vi.fn(),
	findManyWorkoutSets: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		workoutSetGroups: {
			id: "workout_set_groups.id",
			userId: "workout_set_groups.user_id",
		},
		workoutSets: {
			id: "workout_sets.id",
			setGroupId: "workout_sets.set_group_id",
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
			workoutSets: {
				findMany: mocks.findManyWorkoutSets,
			},
		},
		update: mocks.update,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAuth: mocks.requireAuth,
}));

import BulkEditRoute from "@/routes/api/set-groups.$id.bulk-edit";
import ReplaceExerciseRoute from "@/routes/api/set-groups.$id.replace-exercise";

const bulkEditHandlers = BulkEditRoute.options.server?.handlers as {
	POST: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

const replaceExerciseHandlers = ReplaceExerciseRoute.options.server
	?.handlers as {
	POST: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

function createPostRequest(body: unknown) {
	return new Request("http://localhost/api/set-groups/group_123", {
		method: "POST",
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
	});
}

describe("POST /api/set-groups/:id/bulk-edit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
		});
		mocks.update.mockReturnValue({
			set: mocks.updateSet,
		});
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockResolvedValue(undefined);
	});

	it("returns 401 when authentication fails unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await bulkEditHandlers.POST({
			request: createPostRequest({ reps: 8 }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns the auth response when authentication throws a Response", async () => {
		mocks.requireAuth.mockRejectedValueOnce(
			Response.json({ error: "Unauthorized" }, { status: 401 }),
		);

		const response = await bulkEditHandlers.POST({
			request: createPostRequest({ reps: 8 }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 404 when the set group does not exist", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValueOnce(null);

		const response = await bulkEditHandlers.POST({
			request: createPostRequest({ reps: 8 }),
			params: { id: "group_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Set group not found",
		});
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 403 when the set group belongs to another user", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValueOnce({
			id: "group_123",
			userId: "user_999",
		});

		const response = await bulkEditHandlers.POST({
			request: createPostRequest({ reps: 8 }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid bulk-edit payload", async () => {
		const response = await bulkEditHandlers.POST({
			request: createPostRequest({}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("updates every set in the group with the provided fields", async () => {
		mocks.findManyWorkoutSets.mockResolvedValue([
			{ id: "set_1" },
			{ id: "set_2" },
		]);

		const response = await bulkEditHandlers.POST({
			request: createPostRequest({
				reps: 8,
				weight: 135,
				repetitionUnitId: "reps",
				weightUnitId: "lb",
				restTime: 90,
			}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.findFirstWorkoutSetGroup).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.workoutSetGroups.id,
				right: "group_123",
			},
		});
		expect(mocks.findManyWorkoutSets).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.workoutSets.setGroupId,
				right: "group_123",
			},
		});
		expect(mocks.update).toHaveBeenCalledTimes(2);
		expect(mocks.update).toHaveBeenCalledWith(mocks.schema.workoutSets);
		expect(mocks.updateSet).toHaveBeenCalledTimes(2);
		expect(mocks.updateWhere).toHaveBeenCalledTimes(2);
		expect(
			mocks.updateWhere.mock.calls.map(([condition]) => condition.right).sort(),
		).toEqual(["set_1", "set_2"]);
		for (const [payload] of mocks.updateSet.mock.calls) {
			expect(payload).toMatchObject({
				reps: 8,
				weight: 135,
				repetitionUnitId: "reps",
				weightUnitId: "lb",
				restTime: 90,
				updatedAt: expect.any(Date),
			});
			expect(payload).not.toHaveProperty("exerciseId");
		}
	});

	it("returns 500 when an unexpected error occurs", async () => {
		mocks.findManyWorkoutSets.mockRejectedValueOnce(new Error("boom"));

		const response = await bulkEditHandlers.POST({
			request: createPostRequest({ reps: 8 }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to bulk edit",
		});
		expect(mocks.update).not.toHaveBeenCalled();
	});
});

describe("POST /api/set-groups/:id/replace-exercise", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
		});
		mocks.update.mockReturnValue({
			set: mocks.updateSet,
		});
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockResolvedValue(undefined);
	});

	it("returns 401 when authentication fails unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await replaceExerciseHandlers.POST({
			request: createPostRequest({ exerciseId: "exercise_new" }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns the auth response when authentication throws a Response", async () => {
		mocks.requireAuth.mockRejectedValueOnce(
			Response.json({ error: "Unauthorized" }, { status: 401 }),
		);

		const response = await replaceExerciseHandlers.POST({
			request: createPostRequest({ exerciseId: "exercise_new" }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 404 when the set group does not exist", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValueOnce(null);

		const response = await replaceExerciseHandlers.POST({
			request: createPostRequest({ exerciseId: "exercise_new" }),
			params: { id: "group_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Set group not found",
		});
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 403 when the set group belongs to another user", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValueOnce({
			id: "group_123",
			userId: "user_999",
		});

		const response = await replaceExerciseHandlers.POST({
			request: createPostRequest({ exerciseId: "exercise_new" }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid replace-exercise payload", async () => {
		const response = await replaceExerciseHandlers.POST({
			request: createPostRequest({}),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("updates every set in the group with the new exercise", async () => {
		mocks.findManyWorkoutSets.mockResolvedValue([
			{ id: "set_1" },
			{ id: "set_2" },
			{ id: "set_3" },
		]);

		const response = await replaceExerciseHandlers.POST({
			request: createPostRequest({ exerciseId: "exercise_new" }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.findFirstWorkoutSetGroup).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.workoutSetGroups.id,
				right: "group_123",
			},
		});
		expect(mocks.findManyWorkoutSets).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.workoutSets.setGroupId,
				right: "group_123",
			},
		});
		expect(mocks.update).toHaveBeenCalledTimes(3);
		expect(mocks.update).toHaveBeenCalledWith(mocks.schema.workoutSets);
		expect(mocks.updateSet).toHaveBeenCalledTimes(3);
		expect(mocks.updateWhere).toHaveBeenCalledTimes(3);
		expect(
			mocks.updateWhere.mock.calls.map(([condition]) => condition.right).sort(),
		).toEqual(["set_1", "set_2", "set_3"]);
		for (const [payload] of mocks.updateSet.mock.calls) {
			expect(payload).toMatchObject({
				exerciseId: "exercise_new",
				updatedAt: expect.any(Date),
			});
			expect(payload).not.toHaveProperty("reps");
			expect(payload).not.toHaveProperty("weight");
		}
	});

	it("returns 500 when an unexpected error occurs", async () => {
		mocks.findManyWorkoutSets.mockRejectedValueOnce(new Error("boom"));

		const response = await replaceExerciseHandlers.POST({
			request: createPostRequest({ exerciseId: "exercise_new" }),
			params: { id: "group_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to replace exercise",
		});
		expect(mocks.update).not.toHaveBeenCalled();
	});
});
