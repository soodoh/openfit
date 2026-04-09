import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findManyWorkoutSessions: vi.fn(),
	findFirstRoutineDay: vi.fn(),
	findManyWorkoutSetGroups: vi.fn(),
	findManyWorkoutSets: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	getSessionWithData: vi.fn(),
	withSessionsData: vi.fn(),
	nanoid: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	and: vi.fn((...conditions) => ({ type: "and", conditions })),
	gte: vi.fn((left, right) => ({ type: "gte", left, right })),
	lt: vi.fn((left, right) => ({ type: "lt", left, right })),
	asc: vi.fn((value) => ({ type: "asc", value })),
	desc: vi.fn((value) => ({ type: "desc", value })),
	schema: {
		workoutSessions: {
			id: "workout_sessions.id",
			userId: "workout_sessions.user_id",
			startTime: "workout_sessions.start_time",
		},
		routineDays: {
			id: "routine_days.id",
		},
		workoutSetGroups: {
			order: "workout_set_groups.order",
			routineDayId: "workout_set_groups.routine_day_id",
		},
		workoutSets: {
			order: "workout_sets.order",
			setGroupId: "workout_sets.set_group_id",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	and: mocks.and,
	asc: mocks.asc,
	desc: mocks.desc,
	eq: mocks.eq,
	gte: mocks.gte,
	lt: mocks.lt,
}));

vi.mock("nanoid", () => ({
	nanoid: mocks.nanoid,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			workoutSessions: {
				findMany: mocks.findManyWorkoutSessions,
			},
			routineDays: {
				findFirst: mocks.findFirstRoutineDay,
			},
			workoutSetGroups: {
				findMany: mocks.findManyWorkoutSetGroups,
			},
			workoutSets: {
				findMany: mocks.findManyWorkoutSets,
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

vi.mock("@/lib/data-loaders", () => ({
	getSessionWithData: mocks.getSessionWithData,
	withSessionsData: mocks.withSessionsData,
}));

import SessionsRoute from "@/routes/api/sessions";

const handlers = SessionsRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
	POST: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/sessions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findManyWorkoutSessions.mockResolvedValue([]);
		mocks.withSessionsData.mockResolvedValue([]);
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
		mocks.requireAuth.mockRejectedValueOnce(authResponse);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.findManyWorkoutSessions).not.toHaveBeenCalled();
	});

	it("falls back to a generic 401 when authentication throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findManyWorkoutSessions).not.toHaveBeenCalled();
	});

	it("returns date-range summaries without loading full session data", async () => {
		const createdAt = new Date("2025-01-01T10:00:00.000Z");
		const startTime = new Date("2025-01-01T10:00:00.000Z");
		const endTime = new Date("2025-01-01T11:00:00.000Z");
		mocks.findManyWorkoutSessions.mockResolvedValue([
			{
				id: "session_1",
				createdAt,
				name: "Leg Day",
				startTime,
				endTime,
				impression: 4,
				userId: "user_123",
				notes: "ignored",
			},
		]);

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/sessions?startDate=1735689600000&endDate=1735776000000",
			),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{
				id: "session_1",
				createdAt: createdAt.toISOString(),
				name: "Leg Day",
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				impression: 4,
			},
		]);
		expect(mocks.withSessionsData).not.toHaveBeenCalled();
		expect(mocks.findManyWorkoutSessions).toHaveBeenCalledWith({
			orderBy: { type: "desc", value: mocks.schema.workoutSessions.startTime },
			where: expect.objectContaining({
				type: "and",
				conditions: expect.arrayContaining([
					expect.objectContaining({
						type: "eq",
						left: mocks.schema.workoutSessions.userId,
						right: "user_123",
					}),
					expect.objectContaining({
						type: "gte",
						left: mocks.schema.workoutSessions.startTime,
						right: new Date(1735689600000),
					}),
					expect.objectContaining({
						type: "lt",
						left: mocks.schema.workoutSessions.startTime,
						right: new Date(1735776000000),
					}),
				]),
			}),
		});
	});

	it("returns the full session payload when no date range is provided", async () => {
		const createdAt = new Date("2025-01-01T10:00:00.000Z");
		const startTime = new Date("2025-01-01T10:00:00.000Z");
		const session = {
			id: "session_1",
			createdAt,
			name: "Leg Day",
			startTime,
			endTime: null,
			impression: 4,
			userId: "user_123",
		};
		mocks.findManyWorkoutSessions.mockResolvedValue([session]);
		mocks.withSessionsData.mockResolvedValue([
			{ id: "session_1", name: "Leg Day" },
		]);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{ id: "session_1", name: "Leg Day" },
		]);
		expect(mocks.withSessionsData).toHaveBeenCalledWith([session]);
	});

	it("returns 400 for an incomplete date range query", async () => {
		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/sessions?startDate=1735689600000",
			),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid query parameters",
			}),
		);
		expect(mocks.findManyWorkoutSessions).not.toHaveBeenCalled();
		expect(mocks.withSessionsData).not.toHaveBeenCalled();
	});

	it("returns 401 when authentication throws a non-response error", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 500 when loading sessions throws an unexpected error", async () => {
		mocks.findManyWorkoutSessions.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions"),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to fetch sessions",
		});
	});
});

describe("POST /api/sessions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.nanoid.mockReturnValue("session_new");
		mocks.getSessionWithData.mockResolvedValue({
			id: "session_new",
			name: "Created Session",
		});
		mocks.findFirstRoutineDay.mockResolvedValue(null);
		mocks.findManyWorkoutSetGroups.mockResolvedValue([]);
		mocks.findManyWorkoutSets.mockResolvedValue([]);
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
		mocks.requireAuth.mockRejectedValueOnce(authResponse);

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({ name: "Workout" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("falls back to a generic 401 when authentication throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({ name: "Workout" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("returns 404 when the provided template does not exist", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({ templateId: "template_missing" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Template not found",
		});
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("returns 400 when no name can be derived without a template", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({ notes: "  just notes  " }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Name is required when no template is provided",
		});
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("returns 403 when the provided template belongs to another user", async () => {
		mocks.findFirstRoutineDay.mockResolvedValue({
			id: "template_1",
			userId: "user_other",
			description: "Leg Day",
		});

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({ templateId: "template_1" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid create payload", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({ impression: 6 }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("creates a session without a template and returns the hydrated session", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({
					name: "  Push Day  ",
					notes: "  keep notes  ",
					impression: 5,
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			id: "session_new",
			name: "Created Session",
		});
		expect(mocks.insert).toHaveBeenCalledWith(mocks.schema.workoutSessions);
		expect(mocks.getSessionWithData).toHaveBeenCalledWith("session_new");
	});

	it("creates a session with explicit timing fields", async () => {
		const startTime = 1735689600000;
		const endTime = 1735693200000;

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({
					name: "Timed Session",
					startTime,
					endTime,
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			id: "session_new",
			name: "Created Session",
		});
		expect(mocks.insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				startTime: new Date(startTime),
				endTime: new Date(endTime),
			}),
		);
	});

	it("creates a session from a template and clones the template groups", async () => {
		const createdAt = new Date("2025-01-01T00:00:00.000Z");
		mocks.findFirstRoutineDay.mockResolvedValue({
			id: "template_1",
			userId: "user_123",
			description: "Template Day",
		});
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{
				id: "group_1",
				type: "NORMAL",
				order: 0,
				comment: "first",
			},
		]);
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_1",
				exerciseId: "exercise_1",
				type: "NORMAL",
				weight: 135,
				weightUnitId: "weight_unit",
				reps: 10,
				repetitionUnitId: "rep_unit",
				restTime: 60,
			},
		]);
		mocks.getSessionWithData.mockResolvedValue({
			id: "session_new",
			createdAt,
		});

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({
					templateId: "template_1",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			id: "session_new",
			createdAt: createdAt.toISOString(),
		});
		expect(mocks.findManyWorkoutSetGroups).toHaveBeenCalledWith({
			where: expect.objectContaining({
				type: "eq",
				left: mocks.schema.workoutSetGroups.routineDayId,
				right: "template_1",
			}),
			orderBy: { type: "asc", value: mocks.schema.workoutSetGroups.order },
		});
	});

	it("returns 500 when creating a session throws an unexpected error", async () => {
		mocks.insertValues.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.POST({
			request: new Request("http://localhost/api/sessions", {
				method: "POST",
				body: JSON.stringify({ name: "Workout" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to create session",
		});
	});
});
