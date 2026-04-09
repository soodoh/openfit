import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAdmin: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		equipment: {
			id: "equipment.id",
			name: "equipment.name",
		},
		categories: {
			id: "categories.id",
			name: "categories.name",
		},
		muscleGroups: {
			id: "muscle_groups.id",
			name: "muscle_groups.name",
		},
		repetitionUnits: {
			id: "repetition_units.id",
			name: "repetition_units.name",
		},
		weightUnits: {
			id: "weight_units.id",
			name: "weight_units.name",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		update: mocks.update,
		delete: mocks.delete,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAdmin: mocks.requireAdmin,
}));

import AdminLookupDetailRoute from "@/routes/api/admin/lookups.$id";

const handlers = AdminLookupDetailRoute.options.server?.handlers as {
	PATCH: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

describe("PATCH /api/admin/lookups/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
		mocks.update.mockReturnValue({
			set: mocks.updateSet,
		});
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockResolvedValue(undefined);
	});

	it("returns the auth response when admin access fails", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/lookups/lookup_1", {
				method: "PATCH",
				body: JSON.stringify({
					type: "equipment",
					name: "Cable Machine",
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "lookup_1" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid update payload", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/lookups/lookup_1", {
				method: "PATCH",
				body: JSON.stringify({ type: "equipment" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "lookup_1" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("updates the lookup and returns success", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/lookups/lookup_1", {
				method: "PATCH",
				body: JSON.stringify({
					type: "categories",
					name: "Strength",
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "lookup_1" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.update).toHaveBeenCalledWith(mocks.schema.categories);
		expect(mocks.updateSet).toHaveBeenCalledWith({ name: "Strength" });
		expect(mocks.eq).toHaveBeenCalledWith(
			mocks.schema.categories.id,
			"lookup_1",
		);
	});

	it("returns 500 when updating a lookup throws an unexpected error", async () => {
		mocks.update.mockImplementationOnce(() => {
			throw new Error("boom");
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/lookups/lookup_1", {
				method: "PATCH",
				body: JSON.stringify({
					type: "categories",
					name: "Strength",
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "lookup_1" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update lookup",
		});
	});
});

describe("DELETE /api/admin/lookups/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
		mocks.delete.mockReturnValue({
			where: mocks.deleteWhere,
		});
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("returns the auth response when admin access fails", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.DELETE({
			request: new Request(
				"http://localhost/api/admin/lookups/lookup_1?type=equipment",
				{ method: "DELETE" },
			),
			params: { id: "lookup_1" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("returns 400 for a missing lookup type", async () => {
		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/admin/lookups/lookup_1", {
				method: "DELETE",
			}),
			params: { id: "lookup_1" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid query parameters",
			}),
		);
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("deletes a lookup and returns success", async () => {
		const response = await handlers.DELETE({
			request: new Request(
				"http://localhost/api/admin/lookups/lookup_1?type=equipment",
				{ method: "DELETE" },
			),
			params: { id: "lookup_1" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.delete).toHaveBeenCalledWith(mocks.schema.equipment);
		expect(mocks.eq).toHaveBeenCalledWith(
			mocks.schema.equipment.id,
			"lookup_1",
		);
	});

	it("returns 500 when deleting a lookup throws an unexpected error", async () => {
		mocks.delete.mockImplementationOnce(() => {
			throw new Error("boom");
		});

		const response = await handlers.DELETE({
			request: new Request(
				"http://localhost/api/admin/lookups/lookup_1?type=equipment",
				{ method: "DELETE" },
			),
			params: { id: "lookup_1" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to delete lookup",
		});
	});
});
