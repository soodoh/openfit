import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findManyWorkoutSessions: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	and: vi.fn((...conditions) => ({ type: "and", conditions })),
	desc: vi.fn((value) => ({ type: "desc", value })),
	isNotNull: vi.fn((value) => ({ type: "isNotNull", value })),
	count: vi.fn(() => ({ type: "count" })),
	gte: vi.fn((left, right) => ({ type: "gte", left, right })),
	sql: vi.fn((strings) => ({
		type: "sql",
		value: strings.join(""),
		as: vi.fn((alias) => ({ type: "sql", alias })),
	})),
	schema: {
		workoutSessions: {
			userId: "workout_sessions.user_id",
			endTime: "workout_sessions.end_time",
			startTime: "workout_sessions.start_time",
		},
		workoutSetGroups: {
			order: "workout_set_groups.order",
		},
		workoutSets: {
			order: "workout_sets.order",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	and: mocks.and,
	count: mocks.count,
	desc: mocks.desc,
	eq: mocks.eq,
	gte: mocks.gte,
	isNotNull: mocks.isNotNull,
	sql: mocks.sql,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			workoutSessions: {
				findMany: mocks.findManyWorkoutSessions,
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

import DashboardRecentSessionsRoute from "@/routes/api/dashboard/recent-sessions";
import DashboardStatsRoute from "@/routes/api/dashboard/stats";

const statsHandlers = DashboardStatsRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

const recentHandlers = DashboardRecentSessionsRoute.options.server
	?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/dashboard/stats", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 when authentication throws a non-response error", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await statsHandlers.GET({
			request: new Request("http://localhost/api/dashboard/stats"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});
});

describe("GET /api/dashboard/recent-sessions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
	});

	it("returns the auth response when authentication throws a Response", async () => {
		mocks.requireAuth.mockRejectedValue(
			Response.json({ error: "Unauthorized" }, { status: 401 }),
		);

		const response = await recentHandlers.GET({
			request: new Request("http://localhost/api/dashboard/recent-sessions"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findManyWorkoutSessions).not.toHaveBeenCalled();
	});

	it("returns the recent session response shape with compatibility ids", async () => {
		const startTime = new Date("2025-01-01T00:00:00.000Z");
		const endTime = new Date("2025-01-01T01:00:00.000Z");
		mocks.findManyWorkoutSessions.mockResolvedValue([
			{
				id: "session_1",
				name: "Upper Day",
				startTime,
				endTime,
				impression: 5,
				setGroups: [
					{
						id: "group_1",
						type: "NORMAL",
						order: 0,
						sets: [
							{
								id: "set_1",
								exerciseId: "exercise_1",
								exercise: {
									id: "exercise_1",
									name: "Bench Press",
								},
							},
						],
					},
				],
			},
		]);

		const response = await recentHandlers.GET({
			request: new Request("http://localhost/api/dashboard/recent-sessions"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{
				id: "session_1",
				_id: "session_1",
				name: "Upper Day",
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				impression: 5,
				setGroups: [
					{
						id: "group_1",
						_id: "group_1",
						type: "NORMAL",
						order: 0,
						sets: [
							{
								id: "set_1",
								_id: "set_1",
								exerciseId: "exercise_1",
								exercise: {
									id: "exercise_1",
									_id: "exercise_1",
									name: "Bench Press",
									imageUrl: null,
								},
							},
						],
					},
				],
			},
		]);
		expect(mocks.findManyWorkoutSessions).toHaveBeenCalledWith({
			where: {
				type: "and",
				conditions: [
					{
						type: "eq",
						left: mocks.schema.workoutSessions.userId,
						right: "user_123",
					},
					{
						type: "isNotNull",
						value: mocks.schema.workoutSessions.endTime,
					},
				],
			},
			orderBy: [
				{
					type: "desc",
					value: mocks.schema.workoutSessions.startTime,
				},
			],
			limit: 6,
			with: {
				setGroups: {
					orderBy: [mocks.schema.workoutSetGroups.order],
					with: {
						sets: {
							orderBy: [mocks.schema.workoutSets.order],
							with: {
								exercise: true,
							},
						},
					},
				},
			},
		});
	});

	it("keeps null exercises null in the compatibility payload", async () => {
		const startTime = new Date("2025-01-01T00:00:00.000Z");
		const endTime = new Date("2025-01-01T01:00:00.000Z");
		mocks.findManyWorkoutSessions.mockResolvedValue([
			{
				id: "session_2",
				name: "Accessory Day",
				startTime,
				endTime,
				impression: null,
				setGroups: [
					{
						id: "group_2",
						type: "DROP_SET",
						order: 1,
						sets: [
							{
								id: "set_2",
								exerciseId: "exercise_missing",
								exercise: null,
							},
						],
					},
				],
			},
		]);

		const response = await recentHandlers.GET({
			request: new Request("http://localhost/api/dashboard/recent-sessions"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			expect.objectContaining({
				id: "session_2",
				setGroups: [
					expect.objectContaining({
						sets: [
							expect.objectContaining({
								exercise: null,
							}),
						],
					}),
				],
			}),
		]);
	});
});
