import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAdmin: vi.fn(),
	select: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	count: vi.fn(() => ({ type: "count" })),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	like: vi.fn((left, right) => ({ type: "like", left, right })),
	asc: vi.fn((value) => ({ type: "asc", value })),
	createId: vi.fn(),
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

function createCountQuery(result: Array<{ count: number }>) {
	const builder = {
		from: vi.fn(),
		where: vi.fn(),
	};
	builder.from.mockReturnValue(builder);
	builder.where.mockResolvedValue(result);
	return builder;
}

function createItemsQuery<T>(result: T[]) {
	const builder = {
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
	};
	builder.from.mockReturnValue(builder);
	builder.where.mockReturnValue(builder);
	builder.orderBy.mockReturnValue(builder);
	builder.limit.mockReturnValue(builder);
	builder.offset.mockResolvedValue(result);
	return builder;
}

vi.mock("@paralleldrive/cuid2", () => ({
	createId: mocks.createId,
}));

vi.mock("drizzle-orm", () => ({
	asc: mocks.asc,
	count: mocks.count,
	eq: mocks.eq,
	like: mocks.like,
}));

vi.mock("@/db", () => ({
	db: {
		select: mocks.select,
		insert: mocks.insert,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAdmin: mocks.requireAdmin,
}));

import AdminLookupsRoute from "@/routes/api/admin/lookups";

const handlers = AdminLookupsRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
	POST: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/admin/lookups", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
	});

	it("returns the auth response when admin access fails", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/lookups?type=equipment"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.select).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid query string", async () => {
		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/lookups?page=2"),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid query parameters",
			}),
		);
		expect(mocks.select).not.toHaveBeenCalled();
	});

	it("returns a paginated filtered lookup list", async () => {
		const totalQuery = createCountQuery([{ count: 7 }]);
		const itemsQuery = createItemsQuery([
			{
				id: "equipment_1",
				name: "Cable Machine",
			},
		]);
		mocks.select
			.mockReturnValueOnce(totalQuery)
			.mockReturnValueOnce(itemsQuery);

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/admin/lookups?type=equipment&page=2&pageSize=3&search=cable",
			),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			items: [
				{
					id: "equipment_1",
					name: "Cable Machine",
				},
			],
			total: 7,
			page: 2,
			pageSize: 3,
		});
		expect(mocks.like).toHaveBeenCalledWith(
			mocks.schema.equipment.name,
			"%cable%",
		);
		expect(totalQuery.where).toHaveBeenCalledWith({
			type: "like",
			left: mocks.schema.equipment.name,
			right: "%cable%",
		});
		expect(itemsQuery.where).toHaveBeenCalledWith({
			type: "like",
			left: mocks.schema.equipment.name,
			right: "%cable%",
		});
		expect(itemsQuery.orderBy).toHaveBeenCalledWith({
			type: "asc",
			value: mocks.schema.equipment.name,
		});
		expect(itemsQuery.limit).toHaveBeenCalledWith(3);
		expect(itemsQuery.offset).toHaveBeenCalledWith(3);
	});

	it("returns 500 when fetching lookups throws an unexpected error", async () => {
		const totalQuery = createCountQuery([{ count: 7 }]);
		const itemsQuery = createItemsQuery([]);
		itemsQuery.offset.mockRejectedValueOnce(new Error("boom"));
		mocks.select
			.mockReturnValueOnce(totalQuery)
			.mockReturnValueOnce(itemsQuery);

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/admin/lookups?type=equipment&page=2&pageSize=3&search=cable",
			),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to fetch lookups",
		});
	});
});

describe("POST /api/admin/lookups", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.createId.mockReturnValue("lookup_1");
	});

	it("returns the auth response when admin access fails", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.POST({
			request: new Request("http://localhost/api/admin/lookups", {
				method: "POST",
				body: JSON.stringify({
					type: "equipment",
					name: "Cable Machine",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid create payload", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/admin/lookups", {
				method: "POST",
				body: JSON.stringify({ type: "equipment" }),
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

	it("creates a lookup and returns the generated id", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/admin/lookups", {
				method: "POST",
				body: JSON.stringify({
					type: "equipment",
					name: "Cable Machine",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ id: "lookup_1" });
		expect(mocks.insert).toHaveBeenCalledWith(mocks.schema.equipment);
		expect(mocks.insertValues).toHaveBeenCalledWith({
			id: "lookup_1",
			name: "Cable Machine",
		});
	});

	it("returns 500 when creating a lookup throws an unexpected error", async () => {
		mocks.insert.mockImplementationOnce(() => {
			throw new Error("boom");
		});

		const response = await handlers.POST({
			request: new Request("http://localhost/api/admin/lookups", {
				method: "POST",
				body: JSON.stringify({
					type: "equipment",
					name: "Cable Machine",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to create lookup",
		});
	});
});
