import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findManyExercises: vi.fn(),
	withFirstExerciseImageUrls: vi.fn(),
	asc: vi.fn((value) => ({ type: "asc", value })),
	like: vi.fn((left, right) => ({ type: "like", left, right })),
	schema: {
		exercises: {
			name: "exercises.name",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	asc: mocks.asc,
	like: mocks.like,
}));

vi.mock("@/db", () => ({
	db: {
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

vi.mock("@/lib/data-loaders", () => ({
	withFirstExerciseImageUrls: mocks.withFirstExerciseImageUrls,
}));

import SimilarExercisesRoute from "@/routes/api/exercises/similar";

const handlers = SimilarExercisesRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/exercises/similar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findManyExercises.mockResolvedValue([]);
		mocks.withFirstExerciseImageUrls.mockImplementation(async (items) =>
			items.map((item) => ({
				...item,
				imageUrl: `/images/${item.id}.jpg`,
			})),
		);
	});

	it("returns 400 for an invalid query string", async () => {
		const response = await handlers.GET({
			request: new Request("http://localhost/api/exercises/similar?limit=0"),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid query parameters",
			}),
		);
		expect(mocks.findManyExercises).not.toHaveBeenCalled();
		expect(mocks.withFirstExerciseImageUrls).not.toHaveBeenCalled();
	});

	it("returns an empty list before querying when no primary muscles are provided", async () => {
		const response = await handlers.GET({
			request: new Request("http://localhost/api/exercises/similar?q=press"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([]);
		expect(mocks.findManyExercises).not.toHaveBeenCalled();
		expect(mocks.withFirstExerciseImageUrls).not.toHaveBeenCalled();
	});

	it("filters by search term, equipment, exclusion, and limit while keeping bodyweight exercises", async () => {
		mocks.findManyExercises.mockResolvedValue([
			{
				id: "exercise_1",
				name: "Excluded Press",
				equipmentId: "barbell",
				primaryMuscles: [{ muscleGroupId: "chest" }],
			},
			{
				id: "exercise_2",
				name: "Bodyweight Press",
				equipmentId: null,
				primaryMuscles: [{ muscleGroupId: "chest" }],
			},
			{
				id: "exercise_3",
				name: "Barbell Press",
				equipmentId: "barbell",
				primaryMuscles: [
					{ muscleGroupId: "chest" },
					{ muscleGroupId: "triceps" },
				],
			},
			{
				id: "exercise_4",
				name: "Dumbbell Press",
				equipmentId: "dumbbell",
				primaryMuscles: [{ muscleGroupId: "chest" }],
			},
		]);

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/exercises/similar?q=press&equipmentIds=barbell&primaryMuscleIds=chest&primaryMuscleIds=triceps&exclude=exercise_1&limit=2",
			),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{
				id: "exercise_2",
				name: "Bodyweight Press",
				equipmentId: null,
				primaryMuscles: [{ muscleGroupId: "chest" }],
				imageUrl: "/images/exercise_2.jpg",
				primaryMuscleIds: ["chest"],
			},
			{
				id: "exercise_3",
				name: "Barbell Press",
				equipmentId: "barbell",
				primaryMuscles: [
					{ muscleGroupId: "chest" },
					{ muscleGroupId: "triceps" },
				],
				imageUrl: "/images/exercise_3.jpg",
				primaryMuscleIds: ["chest", "triceps"],
			},
		]);
		expect(mocks.like).toHaveBeenCalledWith(
			mocks.schema.exercises.name,
			"%press%",
		);
		expect(mocks.findManyExercises).toHaveBeenCalledWith({
			where: expect.objectContaining({
				type: "like",
				left: mocks.schema.exercises.name,
				right: "%press%",
			}),
			orderBy: {
				type: "asc",
				value: mocks.schema.exercises.name,
			},
			limit: 100,
			with: {
				primaryMuscles: true,
			},
		});
		expect(mocks.withFirstExerciseImageUrls).toHaveBeenCalledWith([
			expect.objectContaining({ id: "exercise_2" }),
			expect.objectContaining({ id: "exercise_3" }),
		]);
	});

	it("matches by primary muscles without a search term or equipment filter", async () => {
		mocks.findManyExercises.mockResolvedValue([
			{
				id: "exercise_5",
				name: "Push Up",
				equipmentId: null,
				primaryMuscles: [{ muscleGroupId: "chest" }],
			},
			{
				id: "exercise_6",
				name: "Biceps Curl",
				equipmentId: "dumbbell",
				primaryMuscles: [{ muscleGroupId: "biceps" }],
			},
		]);

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/exercises/similar?primaryMuscleIds=chest",
			),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{
				id: "exercise_5",
				name: "Push Up",
				equipmentId: null,
				primaryMuscles: [{ muscleGroupId: "chest" }],
				imageUrl: "/images/exercise_5.jpg",
				primaryMuscleIds: ["chest"],
			},
		]);
		expect(mocks.like).not.toHaveBeenCalled();
		expect(mocks.findManyExercises).toHaveBeenCalledWith({
			where: undefined,
			orderBy: {
				type: "asc",
				value: mocks.schema.exercises.name,
			},
			limit: 100,
			with: {
				primaryMuscles: true,
			},
		});
	});

	it("returns 500 when loading similar exercises throws an unexpected error", async () => {
		mocks.findManyExercises.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/exercises/similar?q=press&primaryMuscleIds=chest",
			),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to load similar exercises",
		});
		expect(mocks.withFirstExerciseImageUrls).not.toHaveBeenCalled();
	});
});
