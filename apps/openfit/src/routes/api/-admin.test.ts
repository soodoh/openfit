import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAdmin: vi.fn(),
	select: vi.fn(),
	count: vi.fn(() => ({ type: "count" })),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	like: vi.fn((left, right) => ({ type: "like", left, right })),
	schema: {
		userProfiles: {
			id: "user_profiles.id",
			userId: "user_profiles.user_id",
			role: "user_profiles.role",
		},
		users: {
			id: "users.id",
			email: "users.email",
		},
	},
}));

function createTotalQuery(result: Array<{ count: number }>) {
	const builder = {
		from: vi.fn(),
		innerJoin: vi.fn(),
		where: vi.fn(),
	};
	builder.from.mockReturnValue(builder);
	builder.innerJoin.mockReturnValue(builder);
	builder.where.mockResolvedValue(result);
	return builder;
}

function createItemsQuery<T>(result: T[]) {
	const builder = {
		from: vi.fn(),
		innerJoin: vi.fn(),
		where: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
	};
	builder.from.mockReturnValue(builder);
	builder.innerJoin.mockReturnValue(builder);
	builder.where.mockReturnValue(builder);
	builder.limit.mockReturnValue(builder);
	builder.offset.mockResolvedValue(result);
	return builder;
}

vi.mock("drizzle-orm", () => ({
	count: mocks.count,
	eq: mocks.eq,
	like: mocks.like,
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
	requireAdmin: mocks.requireAdmin,
}));

import AdminUsersRoute from "@/routes/api/admin/users";

const handlers = AdminUsersRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/admin/users", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
	});

	it("returns the auth response when admin access fails", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/users"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.select).not.toHaveBeenCalled();
	});

	it("returns a paginated user list", async () => {
		const totalQuery = createTotalQuery([{ count: 9 }]);
		const itemsQuery = createItemsQuery([
			{
				id: "profile_1",
				userId: "user_1",
				email: "athlete@example.com",
				role: "USER",
			},
		]);
		mocks.select
			.mockReturnValueOnce(totalQuery)
			.mockReturnValueOnce(itemsQuery);

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/admin/users?page=2&pageSize=3&search=athlete",
			),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			items: [
				{
					id: "profile_1",
					userId: "user_1",
					email: "athlete@example.com",
					role: "USER",
				},
			],
			total: 9,
			page: 2,
			pageSize: 3,
		});
		expect(mocks.like).toHaveBeenCalledWith(
			mocks.schema.users.email,
			"%athlete%",
		);
		expect(totalQuery.innerJoin).toHaveBeenCalledWith(mocks.schema.users, {
			type: "eq",
			left: mocks.schema.userProfiles.userId,
			right: mocks.schema.users.id,
		});
		expect(totalQuery.where).toHaveBeenCalledWith({
			type: "like",
			left: mocks.schema.users.email,
			right: "%athlete%",
		});
		expect(itemsQuery.limit).toHaveBeenCalledWith(3);
		expect(itemsQuery.offset).toHaveBeenCalledWith(3);
	});

	it("returns 400 for invalid pagination query parameters", async () => {
		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/users?page=0"),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid query parameters",
			}),
		);
		expect(mocks.select).not.toHaveBeenCalled();
	});

	it("returns 500 when fetching users throws an unexpected error", async () => {
		mocks.select.mockImplementationOnce(() => {
			throw new Error("boom");
		});

		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/users"),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to fetch users",
		});
	});
});
