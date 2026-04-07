import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	getOptionalSession: vi.fn(),
	getRoutineDaysWithWeekdays: vi.fn(),
	findFirstRoutine: vi.fn(),
	findFirstRoutineDay: vi.fn(),
	findManyRoutineDays: vi.fn(),
	deleteRoutineWhere: vi.fn(),
	deleteRoutineDayWhere: vi.fn(),
	schema: {
		routines: {
			id: "routines.id",
		},
		routineDays: {
			id: "routine_days.id",
			userId: "routine_days.user_id",
			description: "routine_days.description",
		},
	},
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			routines: {
				findFirst: mocks.findFirstRoutine,
			},
			routineDays: {
				findMany: mocks.findManyRoutineDays,
				findFirst: mocks.findFirstRoutineDay,
			},
		},
		delete: vi.fn((table) => {
			if (table === mocks.schema.routines) {
				return { where: mocks.deleteRoutineWhere };
			}
			if (table === mocks.schema.routineDays) {
				return { where: mocks.deleteRoutineDayWhere };
			}
			return { where: vi.fn() };
		}),
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAuth: mocks.requireAuth,
	getOptionalSession: mocks.getOptionalSession,
}));

vi.mock("@/lib/data-loaders", () => ({
	getRoutineDaysWithWeekdays: mocks.getRoutineDaysWithWeekdays,
	getFirstExerciseImageUrl: vi.fn(),
}));

import RoutineDaysRoute from "@/routes/api/routine-days";
import RoutineDayDetailRoute from "@/routes/api/routine-days.$id";
import RoutineDetailRoute from "@/routes/api/routines.$id";

const routineDetailHandlers = RoutineDetailRoute.options.server?.handlers as {
	GET: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

const routineDayDetailHandlers = RoutineDayDetailRoute.options.server
	?.handlers as {
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

const routineDaysHandlers = RoutineDaysRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

describe("routine api contracts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.getOptionalSession.mockResolvedValue({ user: { id: "user_123" } });
	});

	it("serializes routine-day weekdays to plain numbers in search responses", async () => {
		mocks.findManyRoutineDays.mockResolvedValue([
			{
				id: "day_123",
				routineId: "routine_123",
				userId: "user_123",
				description: "Push",
				createdAt: new Date("2026-04-01T00:00:00.000Z"),
				updatedAt: new Date("2026-04-02T00:00:00.000Z"),
				routine: {
					id: "routine_123",
					userId: "user_123",
					name: "Upper",
					description: null,
					createdAt: new Date("2026-03-01T00:00:00.000Z"),
					updatedAt: new Date("2026-03-02T00:00:00.000Z"),
				},
				weekdays: [
					{ id: "weekday_1", routineDayId: "day_123", weekday: 1 },
					{ id: "weekday_3", routineDayId: "day_123", weekday: 3 },
				],
			},
		]);

		const response = await routineDaysHandlers.GET({
			request: new Request("http://localhost/api/routine-days?search=push"),
		});

		await expect(response.json()).resolves.toEqual([
			expect.objectContaining({
				id: "day_123",
				weekdays: [1, 3],
			}),
		]);
	});

	it("includes serialized routineDays in routine detail responses", async () => {
		mocks.findFirstRoutine.mockResolvedValue({
			id: "routine_123",
			userId: "user_123",
			name: "Upper A",
			description: "Primary upper day",
			createdAt: new Date("2026-04-01T00:00:00.000Z"),
			updatedAt: new Date("2026-04-02T00:00:00.000Z"),
		});
		mocks.getRoutineDaysWithWeekdays.mockResolvedValue([
			{
				id: "day_123",
				routineId: "routine_123",
				userId: "user_123",
				description: "Push",
				createdAt: new Date("2026-04-01T00:00:00.000Z"),
				updatedAt: new Date("2026-04-02T00:00:00.000Z"),
				weekdays: [
					{ id: "weekday_2", routineDayId: "day_123", weekday: 2 },
					{ id: "weekday_4", routineDayId: "day_123", weekday: 4 },
				],
			},
		]);

		const response = await routineDetailHandlers.GET({
			request: new Request("http://localhost/api/routines/routine_123"),
			params: { id: "routine_123" },
		});

		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "routine_123",
				routineDays: [
					expect.objectContaining({
						id: "day_123",
						weekdays: [2, 4],
					}),
				],
			}),
		);
	});

	it("returns the explicit success contract when deleting a routine", async () => {
		mocks.findFirstRoutine.mockResolvedValue({
			id: "routine_123",
			userId: "user_123",
		});

		const response = await routineDetailHandlers.DELETE({
			request: new Request("http://localhost/api/routines/routine_123", {
				method: "DELETE",
			}),
			params: { id: "routine_123" },
		});

		await expect(response.json()).resolves.toEqual({ success: true });
	});

	it("returns the explicit success contract when deleting a routine day", async () => {
		mocks.findFirstRoutineDay.mockResolvedValue({
			id: "day_123",
			routineId: "routine_123",
			userId: "user_123",
		});

		const response = await routineDayDetailHandlers.DELETE({
			request: new Request("http://localhost/api/routine-days/day_123", {
				method: "DELETE",
			}),
			params: { id: "day_123" },
		});

		await expect(response.json()).resolves.toEqual({ success: true });
	});
});
