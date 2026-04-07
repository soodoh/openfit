import { useEffect, useState } from "react";
import type { ExerciseWithRelations } from "@/hooks";

type ExerciseLevel = "beginner" | "intermediate" | "expert";
type ExerciseForce = "push" | "pull" | "static" | "";
type ExerciseMechanic = "compound" | "isolation" | "";

type ExerciseFormValues = {
	name: string;
	equipmentId: string;
	categoryId: string;
	level: ExerciseLevel;
	force: ExerciseForce;
	mechanic: ExerciseMechanic;
	primaryMuscleIds: string[];
	secondaryMuscleIds: string[];
	instructions: string[];
};

type UseExerciseFormStateOptions = {
	open: boolean;
	exercise: ExerciseWithRelations | undefined;
};

function getInitialFormValues(
	exercise: ExerciseWithRelations | undefined,
): ExerciseFormValues {
	if (!exercise) {
		return {
			name: "",
			equipmentId: "",
			categoryId: "",
			level: "beginner",
			force: "",
			mechanic: "",
			primaryMuscleIds: [],
			secondaryMuscleIds: [],
			instructions: [""],
		};
	}

	return {
		name: exercise.name,
		equipmentId: exercise.equipmentId ?? "",
		categoryId: exercise.categoryId,
		level: exercise.level,
		force: exercise.force ?? "",
		mechanic: exercise.mechanic ?? "",
		primaryMuscleIds: exercise.primaryMuscleIds,
		secondaryMuscleIds: exercise.secondaryMuscleIds,
		instructions:
			exercise.instructions.length > 0 ? exercise.instructions : [""],
	};
}

export function useExerciseFormState({
	open,
	exercise,
}: UseExerciseFormStateOptions) {
	const [name, setName] = useState("");
	const [equipmentId, setEquipmentId] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [level, setLevel] = useState<ExerciseLevel>("beginner");
	const [force, setForce] = useState<ExerciseForce>("");
	const [mechanic, setMechanic] = useState<ExerciseMechanic>("");
	const [primaryMuscleIds, setPrimaryMuscleIds] = useState<string[]>([]);
	const [secondaryMuscleIds, setSecondaryMuscleIds] = useState<string[]>([]);
	const [instructions, setInstructions] = useState<string[]>([""]);
	const [error, setError] = useState<string | undefined>(undefined);
	const [isPending, setIsPending] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<string | undefined>(
		undefined,
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		const nextValues = getInitialFormValues(exercise);
		setName(nextValues.name);
		setEquipmentId(nextValues.equipmentId);
		setCategoryId(nextValues.categoryId);
		setLevel(nextValues.level);
		setForce(nextValues.force);
		setMechanic(nextValues.mechanic);
		setPrimaryMuscleIds(nextValues.primaryMuscleIds);
		setSecondaryMuscleIds(nextValues.secondaryMuscleIds);
		setInstructions(nextValues.instructions);
		setError(undefined);
		setUploadProgress(undefined);
	}, [open, exercise]);

	const handleInstructionChange = (index: number, value: string) => {
		setInstructions((currentInstructions) => {
			const nextInstructions = [...currentInstructions];
			nextInstructions[index] = value;
			return nextInstructions;
		});
	};

	const addInstruction = () => {
		setInstructions((currentInstructions) => [...currentInstructions, ""]);
	};

	const removeInstruction = (index: number) => {
		setInstructions((currentInstructions) => {
			if (currentInstructions.length <= 1) {
				return currentInstructions;
			}
			return currentInstructions.filter(
				(_, currentIndex) => currentIndex !== index,
			);
		});
	};

	const toggleMuscle = (
		muscleId: string,
		isPrimary: boolean,
		checked: boolean,
	) => {
		if (isPrimary) {
			if (checked) {
				setPrimaryMuscleIds((currentIds) => [...currentIds, muscleId]);
				setSecondaryMuscleIds((currentIds) =>
					currentIds.filter((id) => id !== muscleId),
				);
				return;
			}

			setPrimaryMuscleIds((currentIds) =>
				currentIds.filter((id) => id !== muscleId),
			);
			return;
		}

		if (checked) {
			setSecondaryMuscleIds((currentIds) => [...currentIds, muscleId]);
			setPrimaryMuscleIds((currentIds) =>
				currentIds.filter((id) => id !== muscleId),
			);
			return;
		}

		setSecondaryMuscleIds((currentIds) =>
			currentIds.filter((id) => id !== muscleId),
		);
	};

	return {
		name,
		setName,
		equipmentId,
		setEquipmentId,
		categoryId,
		setCategoryId,
		level,
		setLevel,
		force,
		setForce,
		mechanic,
		setMechanic,
		primaryMuscleIds,
		setPrimaryMuscleIds,
		secondaryMuscleIds,
		setSecondaryMuscleIds,
		instructions,
		setInstructions,
		error,
		setError,
		isPending,
		setIsPending,
		uploadProgress,
		setUploadProgress,
		handleInstructionChange,
		addInstruction,
		removeInstruction,
		toggleMuscle,
	};
}
