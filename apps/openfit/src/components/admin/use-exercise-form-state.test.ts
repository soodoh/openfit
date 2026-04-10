import { act } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { ExerciseWithRelations } from "@/hooks";
import { useExerciseFormState } from "./use-exercise-form-state";

const mockExercise = {
	id: "exercise-1",
	name: "Bench Press",
	equipmentId: "equipment-1",
	categoryId: "category-1",
	level: "intermediate",
	force: "push",
	mechanic: "compound",
	primaryMuscleIds: ["muscle-1"],
	secondaryMuscleIds: ["muscle-2"],
	instructions: [],
} as ExerciseWithRelations;

describe("useExerciseFormState", () => {
	it("resets the form when an exercise opens", async () => {
		const { result, rerender } = await renderHook(
			({
				open,
				exercise,
			}: {
				open: boolean;
				exercise?: ExerciseWithRelations;
			}) => useExerciseFormState({ open, exercise }),
			{
				initialProps: { open: false, exercise: undefined },
			},
		);

		expect(result.current.name).toBe("");
		expect(result.current.instructions).toEqual([""]);

		rerender({ open: true, exercise: mockExercise });

		expect(result.current.name).toBe("Bench Press");
		expect(result.current.equipmentId).toBe("equipment-1");
		expect(result.current.instructions).toEqual([""]);
	});

	it("manages instruction rows and muscle selection", async () => {
		const { result } = await renderHook(() =>
			useExerciseFormState({ open: true, exercise: mockExercise }),
		);

		act(() => {
			result.current.addInstruction();
		});
		expect(result.current.instructions).toEqual(["", ""]);

		act(() => {
			result.current.handleInstructionChange(1, "Set up the bar");
		});
		expect(result.current.instructions).toEqual(["", "Set up the bar"]);

		act(() => {
			result.current.removeInstruction(0);
		});
		expect(result.current.instructions).toEqual(["Set up the bar"]);

		act(() => {
			result.current.toggleMuscle("muscle-2", true, true);
		});
		expect(result.current.primaryMuscleIds).toEqual(["muscle-1", "muscle-2"]);
		expect(result.current.secondaryMuscleIds).toEqual([]);

		act(() => {
			result.current.toggleMuscle("muscle-1", true, false);
		});
		expect(result.current.primaryMuscleIds).toEqual(["muscle-2"]);
	});

	it("keeps a single instruction row and moves a muscle into secondary selection", async () => {
		const { result } = await renderHook(() =>
			useExerciseFormState({ open: true, exercise: undefined }),
		);

		act(() => {
			result.current.removeInstruction(0);
		});
		expect(result.current.instructions).toEqual([""]);

		act(() => {
			result.current.toggleMuscle("muscle-3", false, true);
		});
		expect(result.current.primaryMuscleIds).toEqual([]);
		expect(result.current.secondaryMuscleIds).toEqual(["muscle-3"]);

		act(() => {
			result.current.toggleMuscle("muscle-3", true, true);
		});
		expect(result.current.primaryMuscleIds).toEqual(["muscle-3"]);
		expect(result.current.secondaryMuscleIds).toEqual([]);
	});

	it("resets the form when a different exercise opens and removes secondary muscles", async () => {
		const { result, rerender } = await renderHook(
			({
				open,
				exercise,
			}: {
				open: boolean;
				exercise?: ExerciseWithRelations;
			}) => useExerciseFormState({ open, exercise }),
			{
				initialProps: { open: true, exercise: mockExercise },
			},
		);

		act(() => {
			result.current.setName("Changed");
			result.current.setInstructions(["Warm up"]);
		});

		rerender({
			open: true,
			exercise: {
				...mockExercise,
				id: "exercise-2",
				name: "Incline Press",
				instructions: ["Press", "Lower"],
			},
		});

		expect(result.current.name).toBe("Incline Press");
		expect(result.current.instructions).toEqual(["Press", "Lower"]);

		act(() => {
			result.current.toggleMuscle("muscle-2", false, false);
		});

		expect(result.current.secondaryMuscleIds).toEqual([]);
	});
});
