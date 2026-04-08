import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findManyExercises: vi.fn(),
	findFirstExercise: vi.fn(),
	withFirstExerciseImageUrls: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	and: vi.fn((...conditions) => ({ type: "and", conditions })),
	asc: vi.fn((value) => ({ type: "asc", value })),
	like: vi.fn((left, right) => ({ type: "like", left, right })),
	schema: {
		exercises: {
			equipmentId: "exercises.equipment_id",
			level: "exercises.level",
			categoryId: "exercises.category_id",
			name: "exercises.name",
			id: "exercises.id",
		},
		exerciseInstructions: {
			order: "exercise_instructions.order",
		},
		exerciseImages: {
			order: "exercise_images.order",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	and: mocks.and,
	asc: mocks.asc,
	eq: mocks.eq,
	like: mocks.like,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			exercises: {
				findMany: mocks.findManyExercises,
				findFirst: mocks.findFirstExercise,
			},
		},
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/data-loaders", () => ({
	withFirstExerciseImageUrls: mocks.withFirstExerciseImageUrls,
}));

import ExercisesRoute from "@/routes/api/exercises";
import ExerciseDetailRoute from "@/routes/api/exercises.$id";

const listHandlers = ExercisesRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

const detailHandlers = ExerciseDetailRoute.options.server?.handlers as {
	GET: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

describe("GET /api/exercises", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findManyExercises.mockResolvedValue([]);
		mocks.withFirstExerciseImageUrls.mockImplementation(async (value) => value);
	});

	it("returns 400 for an invalid query string", async () => {
		const response = await listHandlers.GET({
			request: new Request("http://localhost/api/exercises?limit=0"),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid query parameters",
			}),
		);
		expect(mocks.findManyExercises).not.toHaveBeenCalled();
	});

	it("returns a filtered page of exercises with pagination metadata", async () => {
		mocks.findManyExercises.mockResolvedValue([
			{
				id: "exercise_1",
				name: "Bench Press",
				equipmentId: "barbell",
				primaryMuscles: [{ muscleGroupId: "chest" }],
			},
			{
				id: "exercise_2",
				name: "Push Up",
				equipmentId: null,
				primaryMuscles: [{ muscleGroupId: "chest" }],
			},
			{
				id: "exercise_3",
				name: "Incline Press",
				equipmentId: "dumbbell",
				primaryMuscles: [{ muscleGroupId: "chest" }],
			},
		]);
		mocks.withFirstExerciseImageUrls.mockResolvedValue([
			{
				id: "exercise_1",
				name: "Bench Press",
				equipmentId: "barbell",
				primaryMuscles: [{ muscleGroupId: "chest" }],
				imageUrl: "/bench.jpg",
			},
			{
				id: "exercise_2",
				name: "Push Up",
				equipmentId: null,
				primaryMuscles: [{ muscleGroupId: "chest" }],
				imageUrl: null,
			},
		]);

		const response = await listHandlers.GET({
			request: new Request(
				"http://localhost/api/exercises?limit=2&search=Press&primaryMuscleId=chest&equipmentIds=barbell&equipmentIds=dumbbell",
			),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			page: [
				expect.objectContaining({
					id: "exercise_1",
					name: "Bench Press",
					imageUrl: "/bench.jpg",
					primaryMuscleIds: ["chest"],
					secondaryMuscleIds: [],
				}),
				expect.objectContaining({
					id: "exercise_2",
					name: "Push Up",
					imageUrl: null,
					primaryMuscleIds: ["chest"],
					secondaryMuscleIds: [],
				}),
			],
			isDone: false,
			continueCursor: "2",
		});
		expect(mocks.findManyExercises).toHaveBeenCalledWith({
			where: expect.objectContaining({
				type: "and",
				conditions: expect.arrayContaining([
					expect.objectContaining({
						type: "like",
						left: mocks.schema.exercises.name,
						right: "%Press%",
					}),
				]),
			}),
			orderBy: {
				type: "asc",
				value: mocks.schema.exercises.name,
			},
			limit: 3,
			offset: 0,
			with: {
				equipment: true,
				category: true,
				primaryMuscles: {
					with: {
						muscleGroup: true,
					},
				},
			},
		});
		expect(mocks.withFirstExerciseImageUrls).toHaveBeenCalledWith([
			expect.objectContaining({ id: "exercise_1" }),
			expect.objectContaining({ id: "exercise_2" }),
		]);
	});
});

describe("GET /api/exercises/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 404 when the exercise does not exist", async () => {
		mocks.findFirstExercise.mockResolvedValue(null);

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/exercises/exercise_missing"),
			params: { id: "exercise_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Exercise not found",
		});
	});

	it("returns the normalized exercise detail payload", async () => {
		mocks.findFirstExercise.mockResolvedValue({
			id: "exercise_1",
			name: "Bench Press",
			primaryMuscles: [{ muscleGroupId: "chest" }],
			secondaryMuscles: [{ muscleGroupId: "triceps" }],
			instructions: [
				{ instruction: "Lie back" },
				{ instruction: "Press the bar" },
			],
			images: [{ path: "/bench-1.jpg" }, { path: "/bench-2.jpg" }],
		});

		const response = await detailHandlers.GET({
			request: new Request("http://localhost/api/exercises/exercise_1"),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "exercise_1",
			name: "Bench Press",
			primaryMuscles: [{ muscleGroupId: "chest" }],
			secondaryMuscles: [{ muscleGroupId: "triceps" }],
			instructions: ["Lie back", "Press the bar"],
			images: [{ path: "/bench-1.jpg" }, { path: "/bench-2.jpg" }],
			primaryMuscleIds: ["chest"],
			secondaryMuscleIds: ["triceps"],
			imageUrls: ["/bench-1.jpg", "/bench-2.jpg"],
		});
		expect(mocks.findFirstExercise).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.exercises.id,
				right: "exercise_1",
			},
			with: {
				equipment: true,
				category: true,
				primaryMuscles: { with: { muscleGroup: true } },
				secondaryMuscles: { with: { muscleGroup: true } },
				instructions: {
					orderBy: {
						type: "asc",
						value: mocks.schema.exerciseInstructions.order,
					},
				},
				images: {
					orderBy: {
						type: "asc",
						value: mocks.schema.exerciseImages.order,
					},
				},
			},
		});
	});
});
