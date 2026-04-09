import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExerciseFormModal } from "./exercise-form-modal";

const mockCreateExercise = vi.fn();
const mockUpdateExercise = vi.fn();
const mockUploadFile = vi.fn();

let formSeed = {
	name: "Bench Press",
	equipmentId: "equipment-1",
	categoryId: "category-1",
	level: "intermediate" as const,
	force: "push" as const,
	mechanic: "compound" as const,
	primaryMuscleIds: ["muscle-1"],
	secondaryMuscleIds: ["muscle-2"],
	instructions: ["Set up", ""],
	error: undefined as string | undefined,
	isPending: false,
	uploadProgress: undefined as string | undefined,
};

let imageSeed = [
	{ type: "existing" as const, url: "/existing.jpg" },
	{
		type: "new" as const,
		file: new File(["image"], "new.jpg", { type: "image/jpeg" }),
		url: "blob:new",
	},
];

const mockUseExerciseFormState = vi.fn(() => {
	const [name, setName] = useState(formSeed.name);
	const [equipmentId, setEquipmentId] = useState(formSeed.equipmentId);
	const [categoryId, setCategoryId] = useState(formSeed.categoryId);
	const [level, setLevel] = useState(formSeed.level);
	const [force, setForce] = useState(formSeed.force);
	const [mechanic, setMechanic] = useState(formSeed.mechanic);
	const [primaryMuscleIds, setPrimaryMuscleIds] = useState(
		formSeed.primaryMuscleIds,
	);
	const [secondaryMuscleIds, setSecondaryMuscleIds] = useState(
		formSeed.secondaryMuscleIds,
	);
	const [instructions, setInstructions] = useState(formSeed.instructions);
	const [error, setError] = useState(formSeed.error);
	const [isPending, setIsPending] = useState(formSeed.isPending);
	const [uploadProgress, setUploadProgress] = useState(formSeed.uploadProgress);

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
		handleInstructionChange: (index: number, value: string) => {
			setInstructions((current) => {
				const next = [...current];
				next[index] = value;
				return next;
			});
		},
		addInstruction: () => setInstructions((current) => [...current, ""]),
		removeInstruction: (index: number) => {
			setInstructions((current) =>
				current.length <= 1 ? current : current.filter((_, i) => i !== index),
			);
		},
		toggleMuscle: (muscleId: string, isPrimary: boolean, checked: boolean) => {
			if (isPrimary) {
				if (checked) {
					setPrimaryMuscleIds((current) => [...current, muscleId]);
					setSecondaryMuscleIds((current) =>
						current.filter((id) => id !== muscleId),
					);
					return;
				}
				setPrimaryMuscleIds((current) =>
					current.filter((id) => id !== muscleId),
				);
				return;
			}
			if (checked) {
				setSecondaryMuscleIds((current) => [...current, muscleId]);
				setPrimaryMuscleIds((current) =>
					current.filter((id) => id !== muscleId),
				);
				return;
			}
			setSecondaryMuscleIds((current) =>
				current.filter((id) => id !== muscleId),
			);
		},
	};
});

vi.mock("@unpic/react", () => ({
	Image: ({ src, alt }: { src: string; alt: string }) => (
		<img alt={alt} src={src} />
	),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<p>{children}</p>
	),
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/select", () => ({
	Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SelectContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SelectTrigger: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SelectValue: () => null,
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	PopoverContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	PopoverTrigger: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui/command", () => ({
	Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CommandEmpty: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandGroup: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandInput: () => <input aria-label="Search muscles" />,
	CommandItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./use-exercise-form-state", () => ({
	useExerciseFormState: () => mockUseExerciseFormState(),
}));

vi.mock("./use-exercise-image-queue", () => ({
	useExerciseImageQueue: () => ({
		images: imageSeed,
		addFiles: vi.fn(),
		removeImage: vi.fn(),
		resetImages: vi.fn(),
	}),
}));

vi.mock("@/hooks", () => ({
	useAdminCategories: () => ({
		data: [{ id: "category-1", name: "Chest" }],
	}),
	useAdminCreateExercise: () => ({
		mutateAsync: mockCreateExercise,
	}),
	useAdminEquipment: () => ({
		data: [{ id: "equipment-1", name: "Barbell" }],
	}),
	useAdminMuscleGroups: () => ({
		data: [{ id: "muscle-1", name: "Pectorals" }],
	}),
	useAdminUpdateExercise: () => ({
		mutateAsync: mockUpdateExercise,
	}),
	useUploadFile: () => ({
		mutateAsync: mockUploadFile,
	}),
}));

describe("ExerciseFormModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		formSeed = {
			name: "Bench Press",
			equipmentId: "equipment-1",
			categoryId: "category-1",
			level: "intermediate",
			force: "push",
			mechanic: "compound",
			primaryMuscleIds: ["muscle-1"],
			secondaryMuscleIds: ["muscle-2"],
			instructions: ["Set up", ""],
			error: undefined,
			isPending: false,
			uploadProgress: undefined,
		};
		imageSeed = [
			{ type: "existing", url: "/existing.jpg" },
			{
				type: "new",
				file: new File(["image"], "new.jpg", { type: "image/jpeg" }),
				url: "blob:new",
			},
		];
		mockCreateExercise.mockResolvedValue(undefined);
		mockUpdateExercise.mockResolvedValue(undefined);
		mockUploadFile.mockResolvedValue("/uploaded/new.jpg");
	});

	it("shows validation errors before submitting", async () => {
		formSeed = {
			...formSeed,
			name: "",
			categoryId: "",
			primaryMuscleIds: [],
		};
		const onClose = vi.fn();

		render(<ExerciseFormModal open onClose={onClose} exercise={undefined} />);

		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(
			await screen.findByText("Exercise name is required"),
		).toBeInTheDocument();
		expect(mockCreateExercise).not.toHaveBeenCalled();
		expect(mockUpdateExercise).not.toHaveBeenCalled();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("uploads new images and submits the update flow with cleaned instructions", async () => {
		const onClose = vi.fn();

		render(
			<ExerciseFormModal
				open
				onClose={onClose}
				exercise={{
					id: "exercise-1",
					name: "Bench Press",
					equipmentId: "equipment-1",
					categoryId: "category-1",
					level: "intermediate",
					force: "push",
					mechanic: "compound",
					primaryMuscleIds: ["muscle-1"],
					secondaryMuscleIds: ["muscle-2"],
					instructions: ["Set up", "Drive up"],
					imageUrls: ["/existing.jpg"],
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await waitFor(() => {
			expect(mockUploadFile).toHaveBeenCalledTimes(1);
		});
		expect(mockUploadFile).toHaveBeenCalledWith(imageSeed[1].file);
		expect(mockUpdateExercise).toHaveBeenCalledWith({
			id: "exercise-1",
			name: "Bench Press",
			equipmentId: "equipment-1",
			categoryId: "category-1",
			level: "intermediate",
			force: "push",
			mechanic: "compound",
			primaryMuscleIds: ["muscle-1"],
			secondaryMuscleIds: ["muscle-2"],
			instructions: ["Set up"],
			imageUrls: ["/existing.jpg", "/uploaded/new.jpg"],
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
