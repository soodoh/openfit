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
	findManyExercises: vi.fn(),
	schema: {
		exercises: {
			id: "exercises.id",
			name: "exercises.name",
		},
		exerciseInstructions: {
			order: "exercise_instructions.order",
		},
		exerciseImages: {
			order: "exercise_images.order",
		},
		exercisePrimaryMuscles: {
			exerciseId: "exercise_primary_muscles.exercise_id",
		},
		exerciseSecondaryMuscles: {
			exerciseId: "exercise_secondary_muscles.exercise_id",
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
		query: {
			exercises: {
				findMany: mocks.findManyExercises,
			},
		},
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAdmin: mocks.requireAdmin,
}));

import AdminExercisesRoute from "@/routes/api/admin/exercises";

const handlers = AdminExercisesRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
	POST: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/admin/exercises", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
	});

	it("returns the auth response when admin access fails", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/exercises?page=1"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.select).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid query string", async () => {
		const response = await handlers.GET({
			request: new Request("http://localhost/api/admin/exercises?pageSize=0"),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid query parameters",
			}),
		);
		expect(mocks.select).not.toHaveBeenCalled();
		expect(mocks.findManyExercises).not.toHaveBeenCalled();
	});

	it("returns a paginated and formatted exercise list", async () => {
		const totalQuery = createCountQuery([{ count: 2 }]);
		const exercises = [
			{
				id: "exercise_1",
				name: "Bench Press",
				level: "beginner",
				force: "push",
				mechanic: "compound",
				equipmentId: "barbell",
				categoryId: "chest",
				primaryMuscles: [
					{
						muscleGroupId: "chest",
						muscleGroup: { id: "chest", name: "Chest" },
					},
				],
				secondaryMuscles: [
					{
						muscleGroupId: "triceps",
						muscleGroup: { id: "triceps", name: "Triceps" },
					},
				],
				instructions: [{ instruction: "Lie back" }],
				images: [{ path: "/bench.jpg" }],
				equipment: { id: "barbell", name: "Barbell" },
				category: { id: "chest", name: "Chest" },
			},
		];
		const itemsQuery = createItemsQuery(exercises);
		mocks.select
			.mockReturnValueOnce(totalQuery)
			.mockReturnValueOnce(itemsQuery);
		mocks.findManyExercises.mockResolvedValue(exercises);

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/admin/exercises?page=2&pageSize=1&search=press",
			),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			items: [
				{
					id: "exercise_1",
					name: "Bench Press",
					level: "beginner",
					force: "push",
					mechanic: "compound",
					equipmentId: "barbell",
					categoryId: "chest",
					primaryMuscleIds: ["chest"],
					secondaryMuscleIds: ["triceps"],
					instructions: ["Lie back"],
					imageUrls: ["/bench.jpg"],
					equipment: { id: "barbell", name: "Barbell" },
					category: { id: "chest", name: "Chest" },
					primaryMuscles: [{ id: "chest", name: "Chest" }],
					secondaryMuscles: [{ id: "triceps", name: "Triceps" }],
				},
			],
			total: 2,
			page: 2,
			pageSize: 1,
		});
		expect(mocks.like).toHaveBeenCalledWith(
			mocks.schema.exercises.name,
			"%press%",
		);
		expect(mocks.findManyExercises).toHaveBeenCalledWith({
			with: {
				equipment: true,
				category: true,
				primaryMuscles: {
					with: {
						muscleGroup: true,
					},
				},
				secondaryMuscles: {
					with: {
						muscleGroup: true,
					},
				},
				instructions: {
					orderBy: [
						{
							type: "asc",
							value: mocks.schema.exerciseInstructions.order,
						},
					],
				},
				images: {
					orderBy: [
						{
							type: "asc",
							value: mocks.schema.exerciseImages.order,
						},
					],
				},
			},
			where: expect.objectContaining({
				type: "like",
				left: mocks.schema.exercises.name,
				right: "%press%",
			}),
			orderBy: [
				{
					type: "asc",
					value: mocks.schema.exercises.name,
				},
			],
			limit: 1,
			offset: 1,
		});
	});
});

describe("POST /api/admin/exercises", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.createId.mockReturnValue("exercise_1");
	});

	it("returns 400 for an invalid create payload", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/admin/exercises", {
				method: "POST",
				body: JSON.stringify({ name: "Bench Press" }),
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

	it("creates an exercise and related records", async () => {
		const response = await handlers.POST({
			request: new Request("http://localhost/api/admin/exercises", {
				method: "POST",
				body: JSON.stringify({
					name: "Bench Press",
					categoryId: "chest",
					level: "beginner",
					force: "push",
					mechanic: "compound",
					equipmentId: "barbell",
					primaryMuscleIds: ["chest"],
					secondaryMuscleIds: ["triceps"],
					instructions: ["Lie back"],
					imageUrls: ["/bench.jpg"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ id: "exercise_1" });
		expect(mocks.insert).toHaveBeenNthCalledWith(1, mocks.schema.exercises);
		expect(mocks.insert).toHaveBeenNthCalledWith(
			2,
			mocks.schema.exercisePrimaryMuscles,
		);
		expect(mocks.insert).toHaveBeenNthCalledWith(
			3,
			mocks.schema.exerciseSecondaryMuscles,
		);
		expect(mocks.insert).toHaveBeenNthCalledWith(
			4,
			mocks.schema.exerciseInstructions,
		);
		expect(mocks.insert).toHaveBeenNthCalledWith(
			5,
			mocks.schema.exerciseImages,
		);
		expect(mocks.insertValues).toHaveBeenCalledWith({
			id: "exercise_1",
			name: "Bench Press",
			level: "beginner",
			force: "push",
			mechanic: "compound",
			equipmentId: "barbell",
			categoryId: "chest",
		});
	});
});
