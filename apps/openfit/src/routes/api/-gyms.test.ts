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

describe("GET /api/gyms", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findManyGyms.mockResolvedValue([]);
	});

	it("returns serialized gyms for the current user", async () => {
		const createdAt = new Date("2025-01-01T00:00:00.000Z");
		const updatedAt = new Date("2025-01-02T00:00:00.000Z");
		mocks.findManyGyms.mockResolvedValue([
			{
				id: "gym_1",
				userId: "user_123",
				name: "Home Gym",
				createdAt,
				updatedAt,
				equipment: [
					{ equipmentId: "barbell", equipment: { id: "barbell" } },
					{ equipmentId: "rack", equipment: { id: "rack" } },
				],
			},
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
				createdAt: createdAt.toISOString(),
				updatedAt: updatedAt.toISOString(),
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
});

describe("GET /api/gyms/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
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
});

describe("DELETE /api/gyms/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
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
});
