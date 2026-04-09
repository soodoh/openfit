import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getOptionalSession: vi.fn(),
	getSessionWithData: vi.fn(),
	findManyWorkoutSessions: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	and: vi.fn((...conditions) => ({ type: "and", conditions })),
	desc: vi.fn((value) => ({ type: "desc", value })),
	isNull: vi.fn((value) => ({ type: "isNull", value })),
	schema: {
		workoutSessions: {
			userId: "workout_sessions.user_id",
			endTime: "workout_sessions.end_time",
			startTime: "workout_sessions.start_time",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	and: mocks.and,
	desc: mocks.desc,
	eq: mocks.eq,
	isNull: mocks.isNull,
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
	getOptionalSession: mocks.getOptionalSession,
}));

vi.mock("@/lib/data-loaders", () => ({
	getSessionWithData: mocks.getSessionWithData,
}));

import CurrentSessionRoute from "@/routes/api/sessions/current";

const handlers = CurrentSessionRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/sessions/current", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when the request is unauthenticated", async () => {
		mocks.getOptionalSession.mockResolvedValue(null);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/current"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toBeNull();
		expect(mocks.findManyWorkoutSessions).not.toHaveBeenCalled();
		expect(mocks.getSessionWithData).not.toHaveBeenCalled();
	});

	it("returns null when the user has no active session", async () => {
		mocks.getOptionalSession.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findManyWorkoutSessions.mockResolvedValue([]);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/current"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toBeNull();
		expect(mocks.getSessionWithData).not.toHaveBeenCalled();
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
						type: "isNull",
						value: mocks.schema.workoutSessions.endTime,
					},
				],
			},
			orderBy: {
				type: "desc",
				value: mocks.schema.workoutSessions.startTime,
			},
			limit: 1,
		});
	});

	it("returns the current session with its loaded data", async () => {
		mocks.getOptionalSession.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findManyWorkoutSessions.mockResolvedValue([{ id: "session_123" }]);
		mocks.getSessionWithData.mockResolvedValue({
			id: "session_123",
			name: "Active session",
		});

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/current"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "session_123",
			name: "Active session",
		});
		expect(mocks.getSessionWithData).toHaveBeenCalledWith("session_123");
	});
});
