import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstWorkoutSession: vi.fn(),
	findFirstRoutineDay: vi.fn(),
	findManyWorkoutSetGroups: vi.fn(),
	findFirstWorkoutSetGroup: vi.fn(),
	findManyWorkoutSets: vi.fn(),
	findFirstWorkoutSet: vi.fn(),
	findManyRepetitionUnits: vi.fn(),
	findManyWeightUnits: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	nanoid: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	asc: vi.fn((value) => ({ type: "asc", value })),
	schema: {
		workoutSessions: {
			id: "workout_sessions.id",
		},
		routineDays: {
			id: "routine_days.id",
		},
		workoutSetGroups: {
			id: "workout_set_groups.id",
			userId: "workout_set_groups.user_id",
			sessionId: "workout_set_groups.session_id",
			routineDayId: "workout_set_groups.routine_day_id",
			order: "workout_set_groups.order",
		},
		workoutSets: {
			id: "workout_sets.id",
			userId: "workout_sets.user_id",
			setGroupId: "workout_sets.set_group_id",
			order: "workout_sets.order",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	asc: mocks.asc,
	eq: mocks.eq,
}));

vi.mock("nanoid", () => ({
	nanoid: mocks.nanoid,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			workoutSessions: {
				findFirst: mocks.findFirstWorkoutSession,
			},
			routineDays: {
				findFirst: mocks.findFirstRoutineDay,
			},
			workoutSetGroups: {
				findMany: mocks.findManyWorkoutSetGroups,
				findFirst: mocks.findFirstWorkoutSetGroup,
			},
			workoutSets: {
				findMany: mocks.findManyWorkoutSets,
				findFirst: mocks.findFirstWorkoutSet,
			},
			repetitionUnits: {
				findMany: mocks.findManyRepetitionUnits,
			},
			weightUnits: {
				findMany: mocks.findManyWeightUnits,
			},
		},
		insert: mocks.insert,
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

import SetGroupsRoute from "@/routes/api/set-groups";
import SetGroupDetailRoute from "@/routes/api/set-groups.$id";
import SetsRoute from "@/routes/api/sets";
import SetDetailRoute from "@/routes/api/sets.$id";

const setGroupHandlers = SetGroupsRoute.options.server?.handlers as {
	POST: (args: { request: Request }) => Promise<Response>;
};

const setGroupDetailHandlers = SetGroupDetailRoute.options.server?.handlers as {
	PATCH: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

const setHandlers = SetsRoute.options.server?.handlers as {
	POST: (args: { request: Request }) => Promise<Response>;
};

const setDetailHandlers = SetDetailRoute.options.server?.handlers as {
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

describe("POST /api/set-groups", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.nanoid.mockReturnValue("generated_id");
	});

	it("returns 400 for an invalid create payload", async () => {
		const response = await setGroupHandlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.findFirstWorkoutSession).not.toHaveBeenCalled();
	});

	it("returns 403 when the target session is owned by another user", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_456",
			userId: "user_999",
		});

		const response = await setGroupHandlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({
					sessionId: "session_456",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});
});

describe("PATCH /api/set-groups/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.update.mockReturnValue({
			set: mocks.updateSet,
		});
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockResolvedValue(undefined);
	});

	it("returns 404 when the set group does not exist", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue(null);

		const response = await setGroupDetailHandlers.PATCH({
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
});

describe("DELETE /api/set-groups/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
	});

	it("returns 403 when deleting another user's set group", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_456",
			userId: "user_999",
		});

		const response = await setGroupDetailHandlers.DELETE({
			request: new Request("http://localhost/api/set-groups/group_456", {
				method: "DELETE",
			}),
			params: { id: "group_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});
});

describe("POST /api/sets", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.nanoid.mockReturnValue("set_new");
	});

	it("returns 403 when the set group belongs to another user", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_456",
			userId: "user_999",
		});

		const response = await setHandlers.POST({
			request: new Request("http://localhost/api/sets", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_456",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("creates an auto-completed set for a finished session", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
			sessionId: "session_123",
		});
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			endTime: new Date("2025-01-01T01:00:00.000Z"),
		});
		mocks.findManyWorkoutSets.mockResolvedValue([
			{ id: "set_1", order: 0 },
			{ id: "set_2", order: 1 },
		]);
		mocks.findManyRepetitionUnits.mockResolvedValue([{ id: "rep_unit" }]);
		mocks.findManyWeightUnits.mockResolvedValue([{ id: "weight_unit" }]);
		mocks.findFirstWorkoutSet.mockResolvedValue({
			id: "set_new",
			setGroupId: "group_123",
			completed: true,
			order: 2,
			exercise: { id: "exercise_1", name: "Bench Press" },
			repetitionUnit: { id: "rep_unit", name: "reps" },
			weightUnit: { id: "weight_unit", name: "lb" },
		});

		const response = await setHandlers.POST({
			request: new Request("http://localhost/api/sets", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "set_new",
				setGroupId: "group_123",
				completed: true,
				order: 2,
			}),
		);
		expect(mocks.insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "set_new",
				setGroupId: "group_123",
				exerciseId: "exercise_1",
				order: 2,
				completed: true,
				repetitionUnitId: "rep_unit",
				weightUnitId: "weight_unit",
			}),
		);
	});
});

describe("DELETE /api/sets/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.delete.mockReturnValue({
			where: mocks.deleteWhere,
		});
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("deletes the set group when removing the last set", async () => {
		mocks.findFirstWorkoutSet
			.mockResolvedValueOnce({
				id: "set_123",
				userId: "user_123",
				setGroupId: "group_123",
			})
			.mockResolvedValueOnce(null);

		const response = await setDetailHandlers.DELETE({
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
});
