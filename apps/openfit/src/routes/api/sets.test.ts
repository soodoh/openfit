import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstWorkoutSetGroup: vi.fn(),
	findFirstWorkoutSession: vi.fn(),
	findManyWorkoutSets: vi.fn(),
	findFirstWorkoutSet: vi.fn(),
	findManyRepetitionUnits: vi.fn(),
	findManyWeightUnits: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	nanoid: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		workoutSessions: {
			id: "workout_sessions.id",
			endTime: "workout_sessions.end_time",
		},
		workoutSetGroups: {
			id: "workout_set_groups.id",
			userId: "workout_set_groups.user_id",
			sessionId: "workout_set_groups.session_id",
		},
		workoutSets: {
			id: "workout_sets.id",
			setGroupId: "workout_sets.set_group_id",
			order: "workout_sets.order",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
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
			workoutSetGroups: {
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
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAuth: mocks.requireAuth,
}));

import SetsRoute from "@/routes/api/sets";

const handlers = SetsRoute.options.server?.handlers as {
	POST: (args: { request: Request }) => Promise<Response>;
};

describe("POST /api/sets", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.insert.mockReturnValue({ values: mocks.insertValues });
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.nanoid.mockReturnValue("set_new");
	});

	it("returns the auth response when authorization fails", async () => {
		const authResponse = Response.json({ error: "Nope" }, { status: 401 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sets", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_123",
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
			request: new Request("http://localhost/api/sets", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 400 for an invalid create payload", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/sets", {
				method: "POST",
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
				issues: expect.arrayContaining([
					expect.objectContaining({ path: ["setGroupId"] }),
					expect.objectContaining({ path: ["exerciseId"] }),
				]),
			}),
		);
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
	});

	it("returns 403 when the set group belongs to another user", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_other",
		});

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sets", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("creates a set with default units, ordering, and auto-completion", async () => {
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
			exercise: { id: "exercise_1" },
			repetitionUnit: { id: "rep_unit" },
			weightUnit: { id: "weight_unit" },
		});

		const response = await handlers.POST({
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
				order: 2,
				completed: true,
			}),
		);
		expect(mocks.insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "set_new",
				setGroupId: "group_123",
				exerciseId: "exercise_1",
				order: 2,
				reps: 10,
				repetitionUnitId: "rep_unit",
				weight: 0,
				weightUnitId: "weight_unit",
				restTime: 0,
				completed: true,
			}),
		);
	});

	it("creates a set with every optional field when they are provided", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
			sessionId: "session_123",
		});
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
		});
		mocks.findManyWorkoutSets.mockResolvedValue([{ id: "set_1", order: 0 }]);
		mocks.findManyRepetitionUnits.mockResolvedValue([{ id: "rep_unit" }]);
		mocks.findManyWeightUnits.mockResolvedValue([{ id: "weight_unit" }]);
		mocks.findFirstWorkoutSet.mockResolvedValue({
			id: "set_new",
			setGroupId: "group_123",
			type: "WARMUP",
			reps: 15,
			repetitionUnitId: "rep_unit",
			weight: 225,
			weightUnitId: "weight_unit",
			restTime: 120,
			completed: false,
			exercise: { id: "exercise_1" },
			repetitionUnit: { id: "rep_unit" },
			weightUnit: { id: "weight_unit" },
		});

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sets", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_123",
					exerciseId: "exercise_1",
					type: "WARMUP",
					reps: 15,
					repetitionUnitId: "rep_unit",
					weight: 225,
					weightUnitId: "weight_unit",
					restTime: 120,
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "set_new",
				setGroupId: "group_123",
				type: "WARMUP",
				reps: 15,
				repetitionUnitId: "rep_unit",
				weight: 225,
				weightUnitId: "weight_unit",
				restTime: 120,
				completed: false,
			}),
		);
		expect(mocks.insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "WARMUP",
				reps: 15,
				repetitionUnitId: "rep_unit",
				weight: 225,
				weightUnitId: "weight_unit",
				restTime: 120,
				completed: false,
			}),
		);
	});

	it("returns 500 for unexpected database failures", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_123",
			userId: "user_123",
		});
		mocks.findManyRepetitionUnits.mockResolvedValue([{ id: "rep_unit" }]);
		mocks.findManyWeightUnits.mockResolvedValue([{ id: "weight_unit" }]);
		mocks.insertValues.mockRejectedValue(new Error("boom"));

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sets", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_123",
					exerciseId: "exercise_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to create set",
		});
	});
});
