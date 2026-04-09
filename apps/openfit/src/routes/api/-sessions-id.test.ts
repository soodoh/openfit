import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstWorkoutSession: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	getSessionWithData: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		workoutSessions: {
			id: "workout_sessions.id",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			workoutSessions: {
				findFirst: mocks.findFirstWorkoutSession,
			},
		},
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

vi.mock("@/lib/data-loaders", () => ({
	getSessionWithData: mocks.getSessionWithData,
}));

import SessionRoute from "@/routes/api/sessions.$id";

const handlers = SessionRoute.options.server?.handlers as {
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

describe("GET /api/sessions/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.getSessionWithData.mockResolvedValue({
			id: "session_123",
			name: "Leg Day",
		});
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
		mocks.requireAuth.mockRejectedValueOnce(authResponse);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/session_123"),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.findFirstWorkoutSession).not.toHaveBeenCalled();
	});

	it("falls back to a generic 401 when authentication throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/session_123"),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findFirstWorkoutSession).not.toHaveBeenCalled();
	});

	it("returns 404 when the session does not exist", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue(null);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/session_missing"),
			params: { id: "session_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Session not found",
		});
		expect(mocks.getSessionWithData).not.toHaveBeenCalled();
	});

	it("returns 403 when the session belongs to another user", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_456",
			userId: "user_999",
		});

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/session_456"),
			params: { id: "session_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.getSessionWithData).not.toHaveBeenCalled();
	});

	it("returns the hydrated session when ownership succeeds", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
		});

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/session_123"),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "session_123",
			name: "Leg Day",
		});
		expect(mocks.getSessionWithData).toHaveBeenCalledWith("session_123");
	});

	it("returns 500 when loading the hydrated session throws an unexpected error", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
		});
		mocks.getSessionWithData.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/session_123"),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to fetch session",
		});
	});

	it("returns a response thrown while loading the hydrated session", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
		});
		mocks.getSessionWithData.mockRejectedValueOnce(
			Response.json({ error: "Conflict" }, { status: 409 }),
		);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/sessions/session_123"),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({ error: "Conflict" });
	});
});

describe("PATCH /api/sessions/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
		});
		mocks.update.mockReturnValue({
			set: mocks.updateSet,
		});
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockResolvedValue(undefined);
		mocks.getSessionWithData.mockResolvedValue({
			id: "session_123",
			name: "Trimmed Name",
			notes: "Trimmed Notes",
		});
	});

	it("updates an owned session and trims mutable string fields", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "PATCH",
				body: JSON.stringify({
					name: "  Trimmed Name  ",
					notes: "  Trimmed Notes  ",
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "session_123",
			name: "Trimmed Name",
			notes: "Trimmed Notes",
		});
		expect(mocks.update).toHaveBeenCalledWith(mocks.schema.workoutSessions);
		expect(mocks.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Trimmed Name",
				notes: "Trimmed Notes",
				updatedAt: expect.any(Date),
			}),
		);
		expect(mocks.updateWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.workoutSessions.id,
			right: "session_123",
		});
	});

	it("updates timing fields and clears endTime when provided as zero", async () => {
		const startTime = 1735689600000;

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "PATCH",
				body: JSON.stringify({
					startTime,
					endTime: 0,
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "session_123",
			name: "Trimmed Name",
			notes: "Trimmed Notes",
		});
		expect(mocks.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				startTime: new Date(startTime),
				endTime: null,
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("updates impression and a positive endTime", async () => {
		const endTime = 1735693200000;

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "PATCH",
				body: JSON.stringify({
					impression: 5,
					endTime,
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "session_123",
			name: "Trimmed Name",
			notes: "Trimmed Notes",
		});
		expect(mocks.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				impression: 5,
				endTime: new Date(endTime),
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("returns the auth response when patch authentication throws a Response", async () => {
		mocks.requireAuth.mockRejectedValueOnce(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.findFirstWorkoutSession).not.toHaveBeenCalled();
	});

	it("falls back to a generic 401 when patch authentication throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findFirstWorkoutSession).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid update payload", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "PATCH",
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 404 when the session does not exist", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue(null);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_missing", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Session not found",
		});
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 403 when the session belongs to another user", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_456",
			userId: "user_999",
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_456", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 500 when updating a session throws an unexpected error", async () => {
		mocks.updateWhere.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update session",
		});
	});
});

describe("DELETE /api/sessions/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
		});
		mocks.delete.mockReturnValue({
			where: mocks.deleteWhere,
		});
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("returns 403 when deleting another user's session", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_456",
			userId: "user_999",
		});

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sessions/session_456", {
				method: "DELETE",
			}),
			params: { id: "session_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("returns the auth response when delete authentication throws a Response", async () => {
		mocks.requireAuth.mockRejectedValueOnce(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "DELETE",
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.findFirstWorkoutSession).not.toHaveBeenCalled();
	});

	it("falls back to a generic 401 when delete authentication throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "DELETE",
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findFirstWorkoutSession).not.toHaveBeenCalled();
	});

	it("deletes an owned session", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			userId: "user_123",
		});

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "DELETE",
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.delete).toHaveBeenCalledWith(mocks.schema.workoutSessions);
		expect(mocks.deleteWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.workoutSessions.id,
			right: "session_123",
		});
	});

	it("returns 404 when the session does not exist", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue(null);

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sessions/session_missing", {
				method: "DELETE",
			}),
			params: { id: "session_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Session not found",
		});
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("returns 500 when deleting a session throws an unexpected error", async () => {
		mocks.deleteWhere.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/sessions/session_123", {
				method: "DELETE",
			}),
			params: { id: "session_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to delete session",
		});
	});
});
