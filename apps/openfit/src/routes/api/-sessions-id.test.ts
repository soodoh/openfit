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
});

describe("DELETE /api/sessions/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
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
});
