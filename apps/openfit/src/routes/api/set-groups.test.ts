import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstWorkoutSession: vi.fn(),
	findFirstRoutineDay: vi.fn(),
	findManyWorkoutSetGroups: vi.fn(),
	findFirstWorkoutSetGroup: vi.fn(),
	findManyWorkoutSets: vi.fn(),
	findManyRepetitionUnits: vi.fn(),
	findManyWeightUnits: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
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
			},
			repetitionUnits: {
				findMany: mocks.findManyRepetitionUnits,
			},
			weightUnits: {
				findMany: mocks.findManyWeightUnits,
			},
		},
		insert: mocks.insert,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAuth: mocks.requireAuth,
}));

import SetGroupsRoute from "@/routes/api/set-groups";

const handlers = SetGroupsRoute.options.server?.handlers as {
	POST: (args: { request: Request }) => Promise<Response>;
};

describe("POST /api/set-groups", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.insert.mockReturnValue({ values: mocks.insertValues });
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.nanoid.mockReturnValue("generated_id");
	});

	it("returns the auth response when authorization fails", async () => {
		const authResponse = Response.json({ error: "Nope" }, { status: 401 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({
					sessionId: "session_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Nope" });
	});

	it("falls back to a generic 401 when auth throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("auth failed"));

		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({
					sessionId: "session_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 400 when neither sessionId nor routineDayId is provided", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({ exerciseId: "exercise_1" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
				issues: [
					expect.objectContaining({
						message: "Either sessionId or routineDayId is required",
					}),
				],
			}),
		);
		expect(mocks.findFirstWorkoutSession).not.toHaveBeenCalled();
	});

	it("returns 400 when exerciseId is missing", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({ sessionId: "session_123" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
				issues: [
					expect.objectContaining({
						message: "Invalid input: expected string, received undefined",
					}),
				],
			}),
		);
	});

	it("returns 403 when the target session belongs to another user", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_other",
		});

		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({
					sessionId: "session_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findManyRepetitionUnits).not.toHaveBeenCalled();
	});

	it("returns 500 when default units are missing", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
		});
		mocks.findManyRepetitionUnits.mockResolvedValue([]);
		mocks.findManyWeightUnits.mockResolvedValue([]);

		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({
					sessionId: "session_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Units not found - please seed the database first",
		});
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("creates a set group with default set ordering and units", async () => {
		mocks.findFirstRoutineDay.mockResolvedValue({
			id: "routine_123",
			userId: "user_123",
		});
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{ id: "group_1", order: 0 },
			{ id: "group_2", order: 3 },
		]);
		mocks.findManyRepetitionUnits.mockResolvedValue([{ id: "rep_unit" }]);
		mocks.findManyWeightUnits.mockResolvedValue([{ id: "weight_unit" }]);
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "generated_id",
			userId: "user_123",
			routineDayId: "routine_123",
			order: 4,
		});
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_1",
				order: 0,
				exercise: { id: "exercise_1" },
				repetitionUnit: { id: "rep_unit" },
				weightUnit: { id: "weight_unit" },
			},
			{
				id: "set_2",
				order: 1,
				exercise: { id: "exercise_1" },
				repetitionUnit: { id: "rep_unit" },
				weightUnit: { id: "weight_unit" },
			},
		]);

		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({
					routineDayId: "routine_123",
					exerciseId: "exercise_1",
					type: "SUPERSET",
					numSets: 2,
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "generated_id",
				order: 4,
				routineDayId: "routine_123",
				sets: expect.arrayContaining([
					expect.objectContaining({ id: "set_1", order: 0 }),
					expect.objectContaining({ id: "set_2", order: 1 }),
				]),
			}),
		);
		expect(mocks.insertValues).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				id: "generated_id",
				order: 4,
				type: "SUPERSET",
				routineDayId: "routine_123",
				sessionId: null,
			}),
		);
		expect(mocks.insertValues).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				setGroupId: "generated_id",
				exerciseId: "exercise_1",
				order: 0,
				reps: 10,
				repetitionUnitId: "rep_unit",
				weight: 0,
				weightUnitId: "weight_unit",
				completed: false,
			}),
		);
		expect(mocks.insertValues).toHaveBeenNthCalledWith(
			3,
			expect.objectContaining({
				setGroupId: "generated_id",
				exerciseId: "exercise_1",
				order: 1,
				completed: false,
			}),
		);
	});

	it("auto-completes sets when creating a group inside an ended session", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
			endTime: new Date("2025-01-01T01:00:00.000Z"),
		});
		mocks.findManyWorkoutSetGroups.mockResolvedValue([]);
		mocks.findManyRepetitionUnits.mockResolvedValue([{ id: "rep_unit" }]);
		mocks.findManyWeightUnits.mockResolvedValue([{ id: "weight_unit" }]);
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "generated_id",
			userId: "user_123",
			sessionId: "session_123",
			order: 0,
		});
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_1",
				order: 0,
				exercise: { id: "exercise_1" },
				repetitionUnit: { id: "rep_unit" },
				weightUnit: { id: "weight_unit" },
			},
		]);

		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({
					sessionId: "session_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "generated_id",
				sets: expect.arrayContaining([
					expect.objectContaining({ id: "set_1" }),
				]),
			}),
		);
		expect(mocks.insertValues).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ completed: true }),
		);
	});

	it("returns 500 for unexpected database failures", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
		});
		mocks.findManyRepetitionUnits.mockResolvedValue([{ id: "rep_unit" }]);
		mocks.findManyWeightUnits.mockResolvedValue([{ id: "weight_unit" }]);
		mocks.findManyWorkoutSetGroups.mockRejectedValue(new Error("boom"));

		const response = await handlers.POST({
			request: new Request("http://localhost/api/set-groups", {
				method: "POST",
				body: JSON.stringify({
					sessionId: "session_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to create set group",
		});
	});
});
