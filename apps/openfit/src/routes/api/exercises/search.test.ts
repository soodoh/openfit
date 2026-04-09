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

import SearchExercisesRoute from "@/routes/api/exercises/search";

const handlers = SearchExercisesRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/exercises/search", () => {
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
			request: new Request("http://localhost/api/exercises/search?limit=0"),
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

	it("filters by search term and equipment while keeping bodyweight exercises", async () => {
		mocks.findManyExercises.mockResolvedValue([
			{
				id: "exercise_1",
				name: "Barbell Bench Press",
				equipmentId: "barbell",
				primaryMuscles: [{ muscleGroupId: "chest" }],
			},
			{
				id: "exercise_2",
				name: "Bodyweight Press",
				equipmentId: null,
				primaryMuscles: [{ muscleGroupId: "core" }],
			},
			{
				id: "exercise_3",
				name: "Dumbbell Press",
				equipmentId: "dumbbell",
				primaryMuscles: [{ muscleGroupId: "shoulders" }],
			},
		]);

		const response = await handlers.GET({
			request: new Request(
				"http://localhost/api/exercises/search?q=press&equipmentIds=barbell&limit=2",
			),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{
				id: "exercise_1",
				name: "Barbell Bench Press",
				equipmentId: "barbell",
				primaryMuscles: [{ muscleGroupId: "chest" }],
				imageUrl: "/images/exercise_1.jpg",
				primaryMuscleIds: ["chest"],
			},
			{
				id: "exercise_2",
				name: "Bodyweight Press",
				equipmentId: null,
				primaryMuscles: [{ muscleGroupId: "core" }],
				imageUrl: "/images/exercise_2.jpg",
				primaryMuscleIds: ["core"],
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
			limit: 50,
			with: {
				primaryMuscles: true,
			},
		});
		expect(mocks.withFirstExerciseImageUrls).toHaveBeenCalledWith([
			expect.objectContaining({ id: "exercise_1" }),
			expect.objectContaining({ id: "exercise_2" }),
		]);
	});

	it("returns 500 when loading exercises throws an unexpected error", async () => {
		mocks.findManyExercises.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.GET({
			request: new Request("http://localhost/api/exercises/search?q=press"),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to search exercises",
		});
		expect(mocks.withFirstExerciseImageUrls).not.toHaveBeenCalled();
	});
});
