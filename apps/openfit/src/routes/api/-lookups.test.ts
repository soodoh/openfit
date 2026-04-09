import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	asc: vi.fn((value) => ({ type: "asc", value })),
	findManyCategories: vi.fn(),
	findManyEquipment: vi.fn(),
	findManyMuscleGroups: vi.fn(),
	findManyRepetitionUnits: vi.fn(),
	findManyWeightUnits: vi.fn(),
	schema: {
		categories: {
			name: "categories.name",
		},
		equipment: {
			name: "equipment.name",
		},
		muscleGroups: {
			name: "muscle_groups.name",
		},
		repetitionUnits: {
			name: "repetition_units.name",
		},
		weightUnits: {
			name: "weight_units.name",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	asc: mocks.asc,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			categories: {
				findMany: mocks.findManyCategories,
			},
			equipment: {
				findMany: mocks.findManyEquipment,
			},
			muscleGroups: {
				findMany: mocks.findManyMuscleGroups,
			},
			repetitionUnits: {
				findMany: mocks.findManyRepetitionUnits,
			},
			weightUnits: {
				findMany: mocks.findManyWeightUnits,
			},
		},
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

import CategoriesRoute from "@/routes/api/lookups/categories";
import EquipmentRoute from "@/routes/api/lookups/equipment";
import MuscleGroupsRoute from "@/routes/api/lookups/muscle-groups";
import UnitsRoute from "@/routes/api/lookups/units";

const categoriesHandlers = CategoriesRoute.options.server?.handlers as {
	GET: () => Promise<Response>;
};

const equipmentHandlers = EquipmentRoute.options.server?.handlers as {
	GET: () => Promise<Response>;
};

const muscleGroupsHandlers = MuscleGroupsRoute.options.server?.handlers as {
	GET: () => Promise<Response>;
};

const unitsHandlers = UnitsRoute.options.server?.handlers as {
	GET: () => Promise<Response>;
};

describe("GET /api/lookups/categories", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findManyCategories.mockResolvedValue([
			{ id: "category_1", name: "Barbell" },
			{ id: "category_2", name: "Cardio" },
		]);
	});

	it("returns categories ordered by name", async () => {
		const response = await categoriesHandlers.GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{ id: "category_1", name: "Barbell" },
			{ id: "category_2", name: "Cardio" },
		]);
		expect(mocks.findManyCategories).toHaveBeenCalledWith({
			orderBy: {
				type: "asc",
				value: mocks.schema.categories.name,
			},
		});
	});
});

describe("GET /api/lookups/equipment", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findManyEquipment.mockResolvedValue([
			{ id: "equipment_1", name: "Barbell" },
			{ id: "equipment_2", name: "Dumbbell" },
		]);
	});

	it("returns equipment ordered by name", async () => {
		const response = await equipmentHandlers.GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{ id: "equipment_1", name: "Barbell" },
			{ id: "equipment_2", name: "Dumbbell" },
		]);
		expect(mocks.findManyEquipment).toHaveBeenCalledWith({
			orderBy: {
				type: "asc",
				value: mocks.schema.equipment.name,
			},
		});
	});
});

describe("GET /api/lookups/muscle-groups", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findManyMuscleGroups.mockResolvedValue([
			{ id: "muscle_1", name: "Chest" },
			{ id: "muscle_2", name: "Triceps" },
		]);
	});

	it("returns muscle groups ordered by name", async () => {
		const response = await muscleGroupsHandlers.GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual([
			{ id: "muscle_1", name: "Chest" },
			{ id: "muscle_2", name: "Triceps" },
		]);
		expect(mocks.findManyMuscleGroups).toHaveBeenCalledWith({
			orderBy: {
				type: "asc",
				value: mocks.schema.muscleGroups.name,
			},
		});
	});
});

describe("GET /api/lookups/units", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findManyRepetitionUnits.mockResolvedValue([
			{ id: "rep_1", name: "reps" },
		]);
		mocks.findManyWeightUnits.mockResolvedValue([
			{ id: "weight_1", name: "kg" },
		]);
	});

	it("returns repetition and weight units in a single payload", async () => {
		const response = await unitsHandlers.GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			repetitionUnits: [{ id: "rep_1", name: "reps" }],
			weightUnits: [{ id: "weight_1", name: "kg" }],
		});
		expect(mocks.findManyRepetitionUnits).toHaveBeenCalledWith({
			orderBy: {
				type: "asc",
				value: mocks.schema.repetitionUnits.name,
			},
		});
		expect(mocks.findManyWeightUnits).toHaveBeenCalledWith({
			orderBy: {
				type: "asc",
				value: mocks.schema.weightUnits.name,
			},
		});
	});
});
