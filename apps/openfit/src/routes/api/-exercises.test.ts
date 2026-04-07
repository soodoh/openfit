import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
	db: {
		query: {
			exercises: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
		},
	},
}));

vi.mock("@/db/schema", () => ({
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

vi.mock("@/lib/data-loaders", () => ({
	withFirstExerciseImageUrls: vi.fn(),
}));

vi.mock("@/lib/request-helpers", () => ({
	parseSearchParams: vi.fn(),
}));

vi.mock("@/lib/request-schemas", () => ({
	exercisesListQuerySchema: {},
}));

import ExercisesRoute from "@/routes/api/exercises";
import ExerciseDetailRoute from "@/routes/api/exercises.$id";

describe("public exercise routes", () => {
	it("exposes GET-only handlers", () => {
		const exercisesHandlers =
			(ExercisesRoute.options.server?.handlers as Record<string, unknown>) ??
			{};
		const exerciseDetailHandlers =
			(ExerciseDetailRoute.options.server?.handlers as Record<
				string,
				unknown
			>) ?? {};

		expect(exercisesHandlers).toBeDefined();
		expect(exercisesHandlers?.GET).toBeTypeOf("function");
		expect(Object.hasOwn(exercisesHandlers, "POST")).toBe(false);

		expect(exerciseDetailHandlers).toBeDefined();
		expect(exerciseDetailHandlers?.GET).toBeTypeOf("function");
		expect(Object.hasOwn(exerciseDetailHandlers, "PATCH")).toBe(false);
		expect(Object.hasOwn(exerciseDetailHandlers, "DELETE")).toBe(false);
	});
});
