import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	select: vi.fn(),
	count: vi.fn(() => ({ type: "count" })),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	and: vi.fn((...conditions) => ({ type: "and", conditions })),
	gte: vi.fn((left, right) => ({ type: "gte", left, right })),
	isNotNull: vi.fn((value) => ({ type: "isNotNull", value })),
	desc: vi.fn((value) => ({ type: "desc", value })),
	sql: vi.fn(() => ({
		type: "sql",
		as: vi.fn((alias) => ({ type: "sql", alias })),
	})),
	schema: {
		workoutSessions: {
			userId: "workout_sessions.user_id",
			endTime: "workout_sessions.end_time",
			startTime: "workout_sessions.start_time",
		},
		routines: {
			userId: "routines.user_id",
		},
	},
	from1: vi.fn(),
	from2: vi.fn(),
	from3: vi.fn(),
	from4: vi.fn(),
	where1: vi.fn(),
	where2: vi.fn(),
	where3: vi.fn(),
	where4: vi.fn(),
	groupBy: vi.fn(),
	orderBy: vi.fn(),
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
		select: mocks.select,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAuth: mocks.requireAuth,
}));

import DashboardStatsRoute from "@/routes/api/dashboard/stats";

const handlers = DashboardStatsRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/dashboard/stats", () => {
	const expectedMonday = new Date(2026, 3, 6, 0, 0, 0, 0);

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.select.mockReset();
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 3, 8, 12, 0, 0, 0));
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.select
			.mockReturnValueOnce({ from: mocks.from1 })
			.mockReturnValueOnce({ from: mocks.from2 })
			.mockReturnValueOnce({ from: mocks.from3 })
			.mockReturnValueOnce({ from: mocks.from4 });
		mocks.from1.mockReturnValue({ where: mocks.where1 });
		mocks.from2.mockReturnValue({ where: mocks.where2 });
		mocks.from3.mockReturnValue({ where: mocks.where3 });
		mocks.from4.mockReturnValue({ where: mocks.where4 });
		mocks.where1.mockResolvedValue([{ count: 7 }]);
		mocks.where2.mockResolvedValue([{ count: 4 }]);
		mocks.where3.mockResolvedValue([{ count: 2 }]);
		mocks.where4.mockReturnValue({
			groupBy: mocks.groupBy,
		});
		mocks.groupBy.mockReturnValue({
			orderBy: mocks.orderBy,
		});
		mocks.orderBy.mockResolvedValue([
			{ date: "2026-04-08T00:00:00" },
			{ date: "2026-04-07T00:00:00" },
		]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns dashboard counts and the current streak", async () => {
		const response = await handlers.GET({
			request: new Request("http://localhost/api/dashboard/stats"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			totalSessions: 7,
			totalRoutines: 4,
			thisWeekSessions: 2,
			currentStreak: 2,
		});
		expect(mocks.requireAuth).toHaveBeenCalledTimes(1);
		expect(mocks.select).toHaveBeenCalledTimes(4);
		expect(mocks.gte).toHaveBeenCalledWith(
			mocks.schema.workoutSessions.startTime,
			expectedMonday,
		);
	});

	it("counts a streak starting yesterday when today has no workout", async () => {
		mocks.orderBy.mockResolvedValueOnce([
			{ date: "2026-04-07T00:00:00" },
			{ date: "2026-04-06T00:00:00" },
		]);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/dashboard/stats"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			totalSessions: 7,
			totalRoutines: 4,
			thisWeekSessions: 2,
			currentStreak: 2,
		});
	});

	it("returns 401 when authentication throws a non-response error", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await handlers.GET({
			request: new Request("http://localhost/api/dashboard/stats"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.select).not.toHaveBeenCalled();
	});

	it("returns the auth response when authentication throws a Response", async () => {
		mocks.requireAuth.mockRejectedValue(
			Response.json({ error: "Unauthorized" }, { status: 401 }),
		);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/dashboard/stats"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.select).not.toHaveBeenCalled();
	});
});
