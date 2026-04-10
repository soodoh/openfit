import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

const mocks = vi.hoisted(() => ({
	useEquipment: vi.fn(),
	useMuscleGroups: vi.fn(),
	useCategories: vi.fn(),
}));

vi.mock("@/hooks", () => ({
	useEquipment: mocks.useEquipment,
	useMuscleGroups: mocks.useMuscleGroups,
	useCategories: mocks.useCategories,
}));

import { useExerciseLookups } from "./use-exercise-lookups";

describe("useExerciseLookups", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.useEquipment.mockReturnValue({
			data: [{ id: "eq_1", name: "Barbell" }],
		});
		mocks.useMuscleGroups.mockReturnValue({
			data: [
				{ id: "mg_1", name: "Chest" },
				{ id: "mg_2", name: "Back" },
			],
		});
		mocks.useCategories.mockReturnValue({
			data: [{ id: "cat_1", name: "Strength" }],
		});
	});

	it("reports loading while any lookup query is unresolved", async () => {
		mocks.useEquipment.mockReturnValue({ data: undefined });

		const { result } = await renderHook(() => useExerciseLookups());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.equipment).toBeUndefined();
	});

	it("reports loading while muscle groups are unresolved", async () => {
		mocks.useMuscleGroups.mockReturnValue({ data: undefined });

		const { result } = await renderHook(() => useExerciseLookups());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.muscleGroups).toBeUndefined();
	});

	it("reports loading while categories are unresolved", async () => {
		mocks.useCategories.mockReturnValue({ data: undefined });

		const { result } = await renderHook(() => useExerciseLookups());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.categories).toBeUndefined();
	});

	it("returns names for known ids and safe fallbacks for unknown ids", async () => {
		const { result } = await renderHook(() => useExerciseLookups());

		expect(result.current.isLoading).toBe(false);
		expect(result.current.getEquipmentName("eq_1")).toBe("Barbell");
		expect(result.current.getEquipmentName(undefined)).toBeUndefined();
		expect(result.current.getEquipmentName("missing")).toBeUndefined();
		expect(result.current.getMuscleGroupName("mg_1")).toBe("Chest");
		expect(result.current.getMuscleGroupName("missing")).toBe("");
		expect(result.current.getCategoryName("cat_1")).toBe("Strength");
		expect(result.current.getCategoryName("missing")).toBe("");
		expect(result.current.getMuscleGroupNames(undefined)).toEqual([]);
		expect(
			result.current.getMuscleGroupNames(["mg_1", "missing", "mg_2"]),
		).toEqual(["Chest", "Back"]);
	});

	it("filters empty results from muscle group lookups", async () => {
		mocks.useEquipment.mockReturnValue({ data: [] });
		mocks.useMuscleGroups.mockReturnValue({ data: [] });
		mocks.useCategories.mockReturnValue({ data: [] });

		const { result } = await renderHook(() => useExerciseLookups());

		expect(result.current.isLoading).toBe(false);
		expect(
			result.current.getMuscleGroupNames(["missing_1", "missing_2"]),
		).toEqual([]);
	});
});
