import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	requireOwnedGym: vi.fn(),
	loadGymWithEquipment: vi.fn(),
	findManyGyms: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	nanoid: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	asc: vi.fn((value) => ({ type: "asc", value })),
	schema: {
		gyms: {
			id: "gyms.id",
			userId: "gyms.user_id",
			name: "gyms.name",
		},
		gymEquipment: {
			gymId: "gym_equipment.gym_id",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	asc: mocks.asc,
	eq: mocks.eq,
}));

vi.mock("nanoid", () => ({
	nanoid: mocks.nanoid,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			gyms: {
				findMany: mocks.findManyGyms,
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
	loadGymWithEquipment: mocks.loadGymWithEquipment,
	requireOwnedGym: mocks.requireOwnedGym,
}));

import GymsRoute from "@/routes/api/gyms";
import GymDetailRoute from "@/routes/api/gyms.$id";

const listHandlers = GymsRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
	POST: (args: { request: Request }) => Promise<Response>;
};

const detailHandlers = GymDetailRoute.options.server?.handlers as {
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

function makeGym(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		id: "gym_1",
		userId: "user_123",
		name: "Home Gym",
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: new Date("2025-01-02T00:00:00.000Z"),
		equipment: [],
		...overrides,
	};
}

describe("GET /api/gyms", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findManyGyms.mockResolvedValue([]);
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Denied" }, { status: 403 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/gyms"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Denied" });
		expect(mocks.findManyGyms).not.toHaveBeenCalled();
	});

	it("returns 401 when authentication fails unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/gyms"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.findManyGyms).not.toHaveBeenCalled();
	});

	it("returns serialized gyms for the current user", async () => {
		mocks.findManyGyms.mockResolvedValue([
			makeGym({
				id: "gym_1",
				name: "Home Gym",
				equipment: [
					{ equipmentId: "barbell", equipment: { id: "barbell" } },
					{ equipmentId: "rack", equipment: { id: "rack" } },
				],
			}),
		]);

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/gyms"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{
				id: "gym_1",
				userId: "user_123",
				name: "Home Gym",
				createdAt: "2025-01-01T00:00:00.000Z",
				updatedAt: "2025-01-02T00:00:00.000Z",
				equipmentIds: ["barbell", "rack"],
			},
		]);
		expect(mocks.findManyGyms).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.gyms.userId,
				right: "user_123",
			},
			orderBy: {
				type: "asc",
				value: mocks.schema.gyms.name,
			},
			with: {
				equipment: {
					with: {
						equipment: true,
					},
				},
			},
		});
	});

	it("returns 500 when loading gyms throws an unexpected error", async () => {
		mocks.findManyGyms.mockRejectedValue(new Error("database unavailable"));

		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/gyms"),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to fetch gyms",
		});
	});
});

describe("POST /api/gyms", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.nanoid.mockReturnValue("gym_new");
		mocks.loadGymWithEquipment.mockResolvedValue(
			makeGym({ id: "gym_new", equipment: [] }),
		);
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Denied" }, { status: 403 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/gyms", {
				method: "POST",
				body: JSON.stringify({ name: "Home Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Denied" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("returns 401 when authentication fails unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/gyms", {
				method: "POST",
				body: JSON.stringify({ name: "Home Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid create payload", async () => {
		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/gyms", {
				method: "POST",
				body: JSON.stringify({ equipmentIds: ["barbell"] }),
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

	it("creates a gym without equipment ids", async () => {
		mocks.loadGymWithEquipment.mockResolvedValue(
			makeGym({ id: "gym_new", name: "Minimal Gym", equipment: [] }),
		);

		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/gyms", {
				method: "POST",
				body: JSON.stringify({ name: "Minimal Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			id: "gym_new",
			userId: "user_123",
			name: "Minimal Gym",
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			equipmentIds: [],
		});
		expect(mocks.insert).toHaveBeenCalledTimes(1);
		expect(mocks.loadGymWithEquipment).toHaveBeenCalledWith("gym_new");
	});

	it("creates a gym and its equipment associations when equipment ids are provided", async () => {
		mocks.nanoid
			.mockReturnValueOnce("gym_new")
			.mockReturnValueOnce("gym_equipment_1")
			.mockReturnValueOnce("gym_equipment_2");
		mocks.loadGymWithEquipment.mockResolvedValue(
			makeGym({
				id: "gym_new",
				name: "Garage Gym",
				equipment: [
					{ equipmentId: "barbell", equipment: { id: "barbell" } },
					{ equipmentId: "rack", equipment: { id: "rack" } },
				],
			}),
		);

		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/gyms", {
				method: "POST",
				body: JSON.stringify({
					name: "Garage Gym",
					equipmentIds: ["barbell", "rack"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			id: "gym_new",
			userId: "user_123",
			name: "Garage Gym",
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			equipmentIds: ["barbell", "rack"],
		});
		expect(mocks.insert).toHaveBeenNthCalledWith(1, mocks.schema.gyms);
		expect(mocks.insert).toHaveBeenNthCalledWith(2, mocks.schema.gymEquipment);
		expect(mocks.insert).toHaveBeenNthCalledWith(3, mocks.schema.gymEquipment);
		expect(mocks.nanoid).toHaveBeenCalledTimes(3);
	});

	it("returns 500 when the created gym cannot be reloaded", async () => {
		mocks.loadGymWithEquipment.mockResolvedValue(null);

		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/gyms", {
				method: "POST",
				body: JSON.stringify({ name: "Garage Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to create gym",
		});
	});

	it("returns 500 when creating a gym throws an unexpected error", async () => {
		mocks.loadGymWithEquipment.mockRejectedValue(new Error("boom"));

		const response = await listHandlers.POST({
			request: new Request("http://localhost/api/gyms", {
				method: "POST",
				body: JSON.stringify({ name: "Garage Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to create gym",
		});
	});
});

describe("GET /api/gyms/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Denied" }, { status: 403 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/gyms/gym_123"),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Denied" });
		expect(mocks.requireOwnedGym).not.toHaveBeenCalled();
	});

	it("returns 401 when authentication fails unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/gyms/gym_123"),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.requireOwnedGym).not.toHaveBeenCalled();
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Denied" }, { status: 403 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Denied" });
		expect(mocks.requireOwnedGym).not.toHaveBeenCalled();
	});

	it("returns 404 when the gym does not exist", async () => {
		mocks.requireOwnedGym.mockResolvedValue({
			status: 404,
			error: "Gym not found",
		});

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/gyms/gym_missing"),
			params: { id: "gym_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Gym not found" });
	});

	it("returns ownership failures from the helper as-is", async () => {
		mocks.requireOwnedGym.mockResolvedValue({
			status: 403,
			error: "Unauthorized",
		});

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/gyms/gym_other_user"),
			params: { id: "gym_other_user" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns the serialized gym when ownership succeeds", async () => {
		mocks.requireOwnedGym.mockResolvedValue({
			status: 200,
			gym: makeGym({
				id: "gym_123",
				equipment: [{ equipmentId: "barbell", equipment: { id: "barbell" } }],
			}),
		});

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/gyms/gym_123"),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "gym_123",
			userId: "user_123",
			name: "Home Gym",
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			equipmentIds: ["barbell"],
		});
	});

	it("returns 500 when loading the gym throws an unexpected error", async () => {
		mocks.requireOwnedGym.mockRejectedValue(new Error("boom"));

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/gyms/gym_123"),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to load gym",
		});
	});
});

describe("PATCH /api/gyms/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.requireOwnedGym.mockResolvedValue({
			status: 200,
			gym: {
				id: "gym_123",
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
		mocks.loadGymWithEquipment.mockResolvedValue(
			makeGym({ id: "gym_123", equipment: [] }),
		);
	});

	it("returns 403 when updating another user's gym", async () => {
		mocks.requireOwnedGym.mockResolvedValue({
			status: 403,
			error: "Unauthorized",
		});

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_456", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 404 when the gym does not exist", async () => {
		mocks.requireOwnedGym.mockResolvedValue({
			status: 404,
			error: "Gym not found",
		});

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_missing", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Gym not found" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("updates the name without replacing equipment when only the name changes", async () => {
		mocks.loadGymWithEquipment.mockResolvedValue(
			makeGym({
				id: "gym_123",
				name: "Updated Gym",
				equipment: [{ equipmentId: "barbell", equipment: { id: "barbell" } }],
			}),
		);

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "gym_123",
			userId: "user_123",
			name: "Updated Gym",
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			equipmentIds: ["barbell"],
		});
		expect(mocks.deleteWhere).not.toHaveBeenCalled();
		expect(mocks.insert).not.toHaveBeenCalled();
		expect(mocks.updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Updated Gym",
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("returns 401 when authentication fails unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.requireOwnedGym).not.toHaveBeenCalled();
	});

	it("replaces equipment when equipment ids are provided", async () => {
		mocks.nanoid
			.mockReturnValueOnce("gym_equipment_1")
			.mockReturnValueOnce("gym_equipment_2");
		mocks.loadGymWithEquipment.mockResolvedValue(
			makeGym({
				id: "gym_123",
				equipment: [
					{ equipmentId: "barbell", equipment: { id: "barbell" } },
					{ equipmentId: "rack", equipment: { id: "rack" } },
				],
			}),
		);

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "PATCH",
				body: JSON.stringify({ equipmentIds: ["barbell", "rack"] }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "gym_123",
			userId: "user_123",
			name: "Home Gym",
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			equipmentIds: ["barbell", "rack"],
		});
		expect(mocks.deleteWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.gymEquipment.gymId,
			right: "gym_123",
		});
		expect(mocks.insert).toHaveBeenCalledTimes(2);
		expect(mocks.nanoid).toHaveBeenCalledTimes(2);
	});

	it("returns 404 when the updated gym can no longer be loaded", async () => {
		mocks.loadGymWithEquipment.mockResolvedValue(null);

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "PATCH",
				body: JSON.stringify({ equipmentIds: ["barbell"] }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Gym not found" });
		expect(mocks.deleteWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.gymEquipment.gymId,
			right: "gym_123",
		});
	});

	it("returns 500 when updating a gym throws an unexpected error", async () => {
		mocks.updateWhere.mockRejectedValue(new Error("boom"));

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update gym",
		});
	});

	it("returns a thrown Response from the update flow", async () => {
		mocks.updateWhere.mockRejectedValue(
			Response.json({ error: "Stop" }, { status: 418 }),
		);

		const response = await detailHandlers.PATCH({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated Gym" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(418);
		await expect(response.json()).resolves.toEqual({ error: "Stop" });
	});
});

describe("DELETE /api/gyms/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.requireOwnedGym.mockResolvedValue({
			status: 200,
			gym: {
				id: "gym_123",
				userId: "user_123",
			},
		});
		mocks.delete.mockReturnValue({
			where: mocks.deleteWhere,
		});
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("returns 403 when deleting another user's gym", async () => {
		mocks.requireOwnedGym.mockResolvedValue({
			status: 403,
			error: "Unauthorized",
		});

		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/gyms/gym_456", {
				method: "DELETE",
			}),
			params: { id: "gym_456" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("returns 404 when the gym does not exist", async () => {
		mocks.requireOwnedGym.mockResolvedValue({
			status: 404,
			error: "Gym not found",
		});

		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/gyms/gym_missing", {
				method: "DELETE",
			}),
			params: { id: "gym_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "Gym not found" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("deletes an owned gym", async () => {
		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "DELETE",
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.deleteWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.gyms.id,
			right: "gym_123",
		});
	});

	it("returns 401 when authentication fails unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "DELETE",
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.requireOwnedGym).not.toHaveBeenCalled();
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Denied" }, { status: 403 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "DELETE",
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Denied" });
		expect(mocks.requireOwnedGym).not.toHaveBeenCalled();
	});

	it("returns 500 when deleting a gym throws an unexpected error", async () => {
		mocks.deleteWhere.mockRejectedValue(new Error("boom"));

		const response = await detailHandlers.DELETE({
			request: new Request("http://localhost/api/gyms/gym_123", {
				method: "DELETE",
			}),
			params: { id: "gym_123" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to delete gym",
		});
	});
});
