import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	requireOwnedRoutine: vi.fn(),
	loadRoutineById: vi.fn(),
	getRoutineDaysWithWeekdays: vi.fn(),
	findManyRoutines: vi.fn(),
	findFirstRoutine: vi.fn(),
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
	desc: vi.fn((value) => ({ type: "desc", value })),
	like: vi.fn((left, right) => ({ type: "like", left, right })),
	schema: {
		routines: {
			id: "routines.id",
			userId: "routines.user_id",
			name: "routines.name",
			updatedAt: "routines.updated_at",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	and: mocks.and,
	desc: mocks.desc,
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
				findMany: mocks.findManyRoutines,
				findFirst: mocks.findFirstRoutine,
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
	requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/api-resource-helpers", () => ({
	loadRoutineById: mocks.loadRoutineById,
	requireOwnedRoutine: mocks.requireOwnedRoutine,
}));

vi.mock("@/lib/data-loaders", () => ({
	getRoutineDaysWithWeekdays: mocks.getRoutineDaysWithWeekdays,
}));

import RoutineRoute from "@/routes/api/routines";
import RoutineDetailRoute from "@/routes/api/routines.$id";

const listHandlers = RoutineRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
	POST: (args: { request: Request }) => Promise<Response>;
};

const detailHandlers = RoutineDetailRoute.options.server?.handlers as {
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

describe("GET /api/routines", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findManyRoutines.mockResolvedValue([]);
		mocks.getRoutineDaysWithWeekdays.mockResolvedValue([]);
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
		mocks.requireAuth.mockRejectedValueOnce(authResponse);

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/routines"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.findManyRoutines).not.toHaveBeenCalled();
	});

	it("falls back to a generic 401 when authentication throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValueOnce(new Error("boom"));

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/routines"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findManyRoutines).not.toHaveBeenCalled();
	});

	it("returns a paginated routine page for the authenticated user", async () => {
		const createdAt = new Date("2025-01-01T00:00:00.000Z");
		const updatedAt = new Date("2025-01-02T00:00:00.000Z");
		mocks.findManyRoutines.mockResolvedValue([
			{
				id: "routine_1",
				userId: "user_123",
				name: "Leg Day",
				description: "Heavy",
				createdAt,
				updatedAt,
			},
			{
				id: "routine_2",
				userId: "user_123",
				name: "Push Day",
				description: null,
				createdAt,
				updatedAt,
			},
		]);
		mocks.getRoutineDaysWithWeekdays.mockResolvedValue([
			{
				id: "routine_day_1",
				userId: "user_123",
				routineId: "routine_1",
				description: "Day 1",
				createdAt,
				updatedAt,
				weekdays: [{ weekday: 1 }],
			},
		]);

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/routines?limit=1&search=Leg"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			page: [
				{
					id: "routine_1",
					userId: "user_123",
					name: "Leg Day",
					description: "Heavy",
					createdAt: createdAt.toISOString(),
					updatedAt: updatedAt.toISOString(),
					routineDays: [
						{
							id: "routine_day_1",
							userId: "user_123",
							routineId: "routine_1",
							description: "Day 1",
							createdAt: createdAt.toISOString(),
							updatedAt: updatedAt.toISOString(),
							weekdays: [1],
						},
					],
				},
			],
			isDone: false,
			continueCursor: "1",
		});
		expect(mocks.findManyRoutines).toHaveBeenCalledWith({
			where: expect.objectContaining({
				type: "and",
				conditions: expect.arrayContaining([
					expect.objectContaining({
						type: "eq",
						left: mocks.schema.routines.userId,
						right: "user_123",
					}),
					expect.objectContaining({
						type: "like",
						left: mocks.schema.routines.name,
						right: "%Leg%",
					}),
				]),
			}),
			orderBy: {
				type: "desc",
				value: mocks.schema.routines.updatedAt,
			},
			limit: 2,
			offset: 0,
		});
	});

	it("returns 400 for an invalid query string", async () => {
		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/routines?limit=not-a-number"),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid query parameters",
			}),
		);
		expect(mocks.findManyRoutines).not.toHaveBeenCalled();
	});

	it("returns 500 when loading routines throws an unexpected error", async () => {
		mocks.findManyRoutines.mockRejectedValueOnce(new Error("boom"));

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/routines"),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to fetch routines",
		});
	});
});

describe("POST /api/routines", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.nanoid.mockReturnValue("routine_new");
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.findFirstRoutine.mockResolvedValue({
			id: "routine_new",
			userId: "user_123",
			name: "Created Routine",
			description: null,
			createdAt: new Date("2025-01-01T00:00:00.000Z"),
			updatedAt: new Date("2025-01-02T00:00:00.000Z"),
		});
	});

	it("returns 400 for an invalid create payload", async () => {
		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/routines", {
				method: "POST",
				body: JSON.stringify({ description: "missing name" }),
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

	it("creates a routine and returns the serialized routine", async () => {
		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/routines", {
				method: "POST",
				body: JSON.stringify({
					name: "  Pull Day  ",
					description: "  Strength  ",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			id: "routine_new",
			userId: "user_123",
			name: "Created Routine",
			description: null,
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			routineDays: [],
		});
		expect(mocks.insert).toHaveBeenCalledWith(mocks.schema.routines);
	});

	it("returns 500 when the created routine cannot be reloaded", async () => {
		mocks.findFirstRoutine.mockResolvedValueOnce(null);

		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/routines", {
				method: "POST",
				body: JSON.stringify({ name: "Pull Day" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to create routine",
		});
	});
});

describe("GET /api/routines/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.requireOwnedRoutine.mockResolvedValue({
			status: 200,
			routine: {
				id: "routine_123",
				userId: "user_123",
				name: "Leg Day",
				description: "Heavy",
				createdAt: new Date("2025-01-01T00:00:00.000Z"),
				updatedAt: new Date("2025-01-02T00:00:00.000Z"),
			},
		});
		mocks.getRoutineDaysWithWeekdays.mockResolvedValue([]);
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Forbidden" }, { status: 403 });
		mocks.requireAuth.mockRejectedValueOnce(authResponse);

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/routines/routine_123"),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.requireOwnedRoutine).not.toHaveBeenCalled();
	});

	it("falls back to a generic 401 when authentication throws unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValueOnce(new Error("boom"));

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/routines/routine_123"),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.requireOwnedRoutine).not.toHaveBeenCalled();
	});

	it("returns 404 when the routine does not exist", async () => {
		mocks.requireOwnedRoutine.mockResolvedValue({
			status: 404,
			error: "Routine not found",
		});

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/routines/routine_missing"),
			params: { id: "routine_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Routine not found",
		});
		expect(mocks.getRoutineDaysWithWeekdays).not.toHaveBeenCalled();
	});

	it("returns the serialized routine when ownership succeeds", async () => {
		mocks.getRoutineDaysWithWeekdays.mockResolvedValue([
			{
				id: "routine_day_1",
				userId: "user_123",
				routineId: "routine_123",
				description: "Day 1",
				createdAt: new Date("2025-01-01T00:00:00.000Z"),
				updatedAt: new Date("2025-01-02T00:00:00.000Z"),
				weekdays: [{ weekday: 1 }],
			},
		]);

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/routines/routine_123"),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "routine_123",
			userId: "user_123",
			name: "Leg Day",
			description: "Heavy",
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			routineDays: [
				{
					id: "routine_day_1",
					userId: "user_123",
					routineId: "routine_123",
					description: "Day 1",
					createdAt: "2025-01-01T00:00:00.000Z",
					updatedAt: "2025-01-02T00:00:00.000Z",
					weekdays: [1],
				},
			],
		});
	});

	it("returns 500 when loading a routine throws an unexpected error", async () => {
		mocks.requireOwnedRoutine.mockRejectedValueOnce(new Error("boom"));

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/routines/routine_123"),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to fetch routine",
		});
	});
});

describe("PATCH /api/routines/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.requireOwnedRoutine.mockResolvedValue({
			status: 200,
			routine: {
				id: "routine_123",
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
		mocks.getRoutineDaysWithWeekdays.mockResolvedValue([]);
	});

	it("returns 400 for an invalid update payload", async () => {
		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/routines/routine_123", {
				method: "PATCH",
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 403 when updating another user's routine", async () => {
		mocks.requireOwnedRoutine.mockResolvedValue({
			status: 403,
			error: "Unauthorized",
		});

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/routines/routine_456", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "routine_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("updates an owned routine and returns the serialized routine", async () => {
		mocks.loadRoutineById.mockResolvedValue({
			id: "routine_123",
			userId: "user_123",
			name: "Updated Routine",
			description: "Updated",
			createdAt: new Date("2025-01-01T00:00:00.000Z"),
			updatedAt: new Date("2025-01-02T00:00:00.000Z"),
		});

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/routines/routine_123", {
				method: "PATCH",
				body: JSON.stringify({
					name: "Updated Routine",
					description: "  Updated  ",
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "routine_123",
			userId: "user_123",
			name: "Updated Routine",
			description: "Updated",
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			routineDays: [],
		});
		expect(mocks.update).toHaveBeenCalledWith(mocks.schema.routines);
	});

	it("returns 404 when the routine disappears after update", async () => {
		mocks.loadRoutineById.mockResolvedValue(null);

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/routines/routine_123", {
				method: "PATCH",
				body: JSON.stringify({ description: "  Updated  " }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Routine not found",
		});
		expect(mocks.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				description: "Updated",
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("returns 500 when updating a routine throws an unexpected error", async () => {
		mocks.updateWhere.mockRejectedValueOnce(new Error("boom"));

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/routines/routine_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update routine",
		});
	});
});

describe("DELETE /api/routines/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.requireOwnedRoutine.mockResolvedValue({
			status: 200,
			routine: {
				id: "routine_123",
				userId: "user_123",
			},
		});
		mocks.delete.mockReturnValue({
			where: mocks.deleteWhere,
		});
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("returns 403 when deleting another user's routine", async () => {
		mocks.requireOwnedRoutine.mockResolvedValue({
			status: 403,
			error: "Unauthorized",
		});

		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/routines/routine_456", {
				method: "DELETE",
			}),
			params: { id: "routine_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("deletes an owned routine", async () => {
		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/routines/routine_123", {
				method: "DELETE",
			}),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.delete).toHaveBeenCalledWith(mocks.schema.routines);
		expect(mocks.deleteWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.routines.id,
			right: "routine_123",
		});
	});

	it("returns 500 when deleting a routine throws an unexpected error", async () => {
		mocks.deleteWhere.mockRejectedValueOnce(new Error("boom"));

		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/routines/routine_123", {
				method: "DELETE",
			}),
			params: { id: "routine_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to delete routine",
		});
	});
});
