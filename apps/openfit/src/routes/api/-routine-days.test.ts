import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getOptionalSession: vi.fn(),
	requireAuth: vi.fn(),
	requireOwnedRoutineDay: vi.fn(),
	loadRoutineDayWithRelations: vi.fn(),
	getFirstExerciseImageUrl: vi.fn(),
	findManyRoutineDays: vi.fn(),
	findFirstRoutine: vi.fn(),
	findManyWorkoutSetGroups: vi.fn(),
	findManyWorkoutSets: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	nanoid: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	and: vi.fn((...conditions) => ({ type: "and", conditions })),
	asc: vi.fn((value) => ({ type: "asc", value })),
	like: vi.fn((left, right) => ({ type: "like", left, right })),
	schema: {
		routines: {
			id: "routines.id",
		},
		routineDays: {
			id: "routine_days.id",
			userId: "routine_days.user_id",
			description: "routine_days.description",
		},
		routineDayWeekdays: {
			routineDayId: "routine_day_weekdays.routine_day_id",
		},
		workoutSetGroups: {
			routineDayId: "workout_set_groups.routine_day_id",
			order: "workout_set_groups.order",
		},
		workoutSets: {
			id: "workout_sets.id",
			setGroupId: "workout_sets.set_group_id",
			order: "workout_sets.order",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	and: mocks.and,
	asc: mocks.asc,
	eq: mocks.eq,
	like: mocks.like,
}));

vi.mock("nanoid", () => ({
	nanoid: mocks.nanoid,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			routines: {
				findFirst: mocks.findFirstRoutine,
			},
			routineDays: {
				findMany: mocks.findManyRoutineDays,
			},
			workoutSetGroups: {
				findMany: mocks.findManyWorkoutSetGroups,
			},
			workoutSets: {
				findMany: mocks.findManyWorkoutSets,
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
	getOptionalSession: mocks.getOptionalSession,
	requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/api-resource-helpers", () => ({
	loadRoutineDayWithRelations: mocks.loadRoutineDayWithRelations,
	requireOwnedRoutineDay: mocks.requireOwnedRoutineDay,
}));

vi.mock("@/lib/data-loaders", () => ({
	getFirstExerciseImageUrl: mocks.getFirstExerciseImageUrl,
}));

import RoutineDaysRoute from "@/routes/api/routine-days";
import RoutineDayDetailRoute from "@/routes/api/routine-days.$id";

const listHandlers = RoutineDaysRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
	POST: (args: { request: Request }) => Promise<Response>;
};

const detailHandlers = RoutineDayDetailRoute.options.server?.handlers as {
	GET: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
	PATCH: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

describe("GET /api/routine-days", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getOptionalSession.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findManyRoutineDays.mockResolvedValue([]);
	});

	it("returns an empty list when there is no session", async () => {
		mocks.getOptionalSession.mockResolvedValue(null);

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/routine-days"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([]);
		expect(mocks.findManyRoutineDays).not.toHaveBeenCalled();
	});
});

describe("POST /api/routine-days", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.nanoid.mockReturnValue("routine_day_new");
	});

	it("returns 403 when creating a routine day for another user's routine", async () => {
		mocks.findFirstRoutine.mockResolvedValue({
			id: "routine_456",
			userId: "user_999",
		});

		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/routine-days", {
				method: "POST",
				body: JSON.stringify({
					routineId: "routine_456",
					description: "Day 1",
					weekdays: [1, 3],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});
});

describe("GET /api/routine-days/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.getFirstExerciseImageUrl.mockResolvedValue("https://cdn/image.jpg");
	});

	it("returns 404 when the routine day does not exist", async () => {
		mocks.requireOwnedRoutineDay.mockResolvedValue({
			status: 404,
			error: "Routine day not found",
		});

		const response = await detailHandlers.GET({
			request: new Request(
				"http://localhost/api/routine-days/routine_day_missing",
			),
			params: { id: "routine_day_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Routine day not found",
		});
		expect(mocks.findManyWorkoutSetGroups).not.toHaveBeenCalled();
	});

	it("returns a detailed routine day payload with set groups", async () => {
		const createdAt = new Date("2025-01-01T00:00:00.000Z");
		const updatedAt = new Date("2025-01-02T00:00:00.000Z");
		mocks.requireOwnedRoutineDay.mockResolvedValue({
			status: 200,
			routineDay: {
				id: "routine_day_123",
				userId: "user_123",
				routineId: "routine_123",
				description: "Chest Day",
				createdAt,
				updatedAt,
				weekdays: [{ weekday: 1 }, { weekday: 3 }],
				routine: {
					id: "routine_123",
					userId: "user_123",
					name: "Push",
					description: null,
					createdAt,
					updatedAt,
				},
			},
		});
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{
				id: "group_1",
				routineDayId: "routine_day_123",
				type: "NORMAL",
				order: 0,
				createdAt,
				updatedAt,
			},
		]);
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_1",
				setGroupId: "group_1",
				exerciseId: "exercise_1",
				type: "NORMAL",
				order: 0,
				reps: 10,
				weight: 135,
				restTime: 60,
				completed: false,
				createdAt,
				updatedAt,
				exercise: {
					id: "exercise_1",
					name: "Bench Press",
				},
				repetitionUnit: {
					id: "rep_unit",
					name: "reps",
				},
				weightUnit: {
					id: "weight_unit",
					name: "lb",
				},
			},
		]);

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/routine-days/routine_day_123"),
			params: { id: "routine_day_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "routine_day_123",
			userId: "user_123",
			routineId: "routine_123",
			description: "Chest Day",
			createdAt: createdAt.toISOString(),
			updatedAt: updatedAt.toISOString(),
			weekdays: [1, 3],
			routine: {
				id: "routine_123",
				userId: "user_123",
				name: "Push",
				description: null,
				createdAt: createdAt.toISOString(),
				updatedAt: updatedAt.toISOString(),
			},
			setGroups: [
				{
					id: "group_1",
					routineDayId: "routine_day_123",
					type: "NORMAL",
					order: 0,
					createdAt: createdAt.toISOString(),
					updatedAt: updatedAt.toISOString(),
					sets: [
						{
							id: "set_1",
							setGroupId: "group_1",
							exerciseId: "exercise_1",
							type: "NORMAL",
							order: 0,
							reps: 10,
							weight: 135,
							restTime: 60,
							completed: false,
							createdAt: createdAt.toISOString(),
							updatedAt: updatedAt.toISOString(),
							exercise: {
								id: "exercise_1",
								name: "Bench Press",
								imageUrl: "https://cdn/image.jpg",
							},
							repetitionUnit: {
								id: "rep_unit",
								name: "reps",
							},
							weightUnit: {
								id: "weight_unit",
								name: "lb",
							},
						},
					],
				},
			],
		});
	});
});

describe("PATCH /api/routine-days/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.requireOwnedRoutineDay.mockResolvedValue({
			status: 200,
			routineDay: {
				id: "routine_day_123",
				userId: "user_123",
			},
		});
		mocks.update.mockReturnValue({
			set: mocks.updateSet,
		});
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockResolvedValue(undefined);
		mocks.delete.mockReturnValue({
			where: mocks.deleteWhere,
		});
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("returns 404 when the updated routine day can no longer be loaded", async () => {
		mocks.loadRoutineDayWithRelations.mockResolvedValue(null);

		const response = await detailHandlers.PATCH({
			request: new Request(
				"http://localhost/api/routine-days/routine_day_123",
				{
					method: "PATCH",
					body: JSON.stringify({ weekdays: [2, 4] }),
					headers: { "Content-Type": "application/json" },
				},
			),
			params: { id: "routine_day_123" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Routine day not found",
		});
		expect(mocks.deleteWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.routineDayWeekdays.routineDayId,
			right: "routine_day_123",
		});
	});
});

describe("DELETE /api/routine-days/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
	});

	it("returns 403 when deleting another user's routine day", async () => {
		mocks.requireOwnedRoutineDay.mockResolvedValue({
			status: 403,
			error: "Unauthorized",
		});

		const response = await detailHandlers.DELETE({
			request: new Request(
				"http://localhost/api/routine-days/routine_day_456",
				{
					method: "DELETE",
				},
			),
			params: { id: "routine_day_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});
});
