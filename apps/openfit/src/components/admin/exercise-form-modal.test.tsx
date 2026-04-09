import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExerciseFormModal } from "./exercise-form-modal";

const mockCreateExercise = vi.fn();
const mockUpdateExercise = vi.fn();
const mockUploadFile = vi.fn();
const mockAddFiles = vi.fn();
const mockRemoveImage = vi.fn();
const mockResetImages = vi.fn();

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
let adminDataSeed = {
	equipment: [{ id: "equipment-1", name: "Barbell" }],
	categories: [{ id: "category-1", name: "Chest" }],
	muscleGroups: [{ id: "muscle-1", name: "Pectorals" }],
};
let latestFormState: ReturnType<typeof mockUseExerciseFormState> | undefined;

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

	const state = {
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
	latestFormState = state;
	return state;
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

const selectChangeContext = createContext<
	((value: string) => void) | undefined
>(undefined);

vi.mock("@/components/ui/select", () => ({
	Select: ({
		children,
		onValueChange,
	}: {
		children: ReactNode;
		onValueChange?: (value: string) => void;
	}) => (
		<selectChangeContext.Provider value={onValueChange}>
			<div>{children}</div>
		</selectChangeContext.Provider>
	),
	SelectContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
		const onValueChange = useContext(selectChangeContext);
		return (
			<button type="button" onClick={() => onValueChange?.(value)}>
				{children}
			</button>
		);
	},
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
	CommandItem: ({
		children,
		onSelect,
	}: {
		children: ReactNode;
		onSelect?: () => void;
	}) => (
		<button type="button" onClick={() => onSelect?.()}>
			{children}
		</button>
	),
	CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: ({
		children,
		onClick,
	}: {
		children: ReactNode;
		onClick?: () => void;
	}) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock("./use-exercise-form-state", () => ({
	useExerciseFormState: () => mockUseExerciseFormState(),
}));

vi.mock("./use-exercise-image-queue", () => ({
	useExerciseImageQueue: () => ({
		images: imageSeed,
		addFiles: mockAddFiles,
		removeImage: mockRemoveImage,
		resetImages: mockResetImages,
	}),
}));

vi.mock("@/hooks", () => ({
	useAdminCategories: () => ({
		data: adminDataSeed.categories,
	}),
	useAdminCreateExercise: () => ({
		mutateAsync: mockCreateExercise,
	}),
	useAdminEquipment: () => ({
		data: adminDataSeed.equipment,
	}),
	useAdminMuscleGroups: () => ({
		data: adminDataSeed.muscleGroups,
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
		latestFormState = undefined;
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
		adminDataSeed = {
			equipment: [{ id: "equipment-1", name: "Barbell" }],
			categories: [{ id: "category-1", name: "Chest" }],
			muscleGroups: [{ id: "muscle-1", name: "Pectorals" }],
		};
		mockCreateExercise.mockResolvedValue(undefined);
		mockUpdateExercise.mockResolvedValue(undefined);
		mockUploadFile.mockResolvedValue("/uploaded/new.jpg");
		mockAddFiles.mockClear();
		mockRemoveImage.mockClear();
		mockResetImages.mockClear();
	});

	it("shows a loading state while exercise metadata is still loading", () => {
		adminDataSeed = {
			equipment: undefined as never,
			categories: undefined as never,
			muscleGroups: undefined as never,
		};

		render(<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />);

		expect(screen.queryByLabelText("Name *")).not.toBeInTheDocument();
		expect(screen.getByText("Add Exercise")).toBeInTheDocument();
	});

	it("shows a no-preview placeholder for blank image entries and ignores empty file selections", () => {
		imageSeed = [
			{
				type: "new",
				file: undefined as never,
				url: undefined as never,
			},
		];

		const { container } = render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		expect(screen.getByText("No preview")).toBeInTheDocument();

		const input = container.querySelector('input[type="file"]');
		expect(input).toBeTruthy();

		fireEvent.change(input as HTMLInputElement, {
			target: { files: null },
		});

		expect(mockAddFiles).not.toHaveBeenCalled();
	});

	it("shows edit mode copy and a pending submit state", () => {
		formSeed = {
			...formSeed,
			isPending: true,
			uploadProgress: "Uploading images (1/1)...",
		};

		render(
			<ExerciseFormModal
				open
				onClose={vi.fn()}
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
					instructions: ["Set up"],
					imageUrls: ["/existing.jpg"],
				}}
			/>,
		);

		expect(screen.getByText("Edit Exercise")).toBeInTheDocument();
		expect(screen.getByText("Update exercise details")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Uploading images (1/1)..." }),
		).toBeDisabled();
		expect(screen.getByText("Uploading images (1/1)...")).toBeInTheDocument();
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

	it("removes extra instruction rows and keeps a single row", async () => {
		formSeed = {
			...formSeed,
			instructions: ["Set up", "Drive up"],
		};

		const { container } = render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		expect(
			screen.getAllByPlaceholderText("Enter instruction step"),
		).toHaveLength(2);

		const removeButtons = container.querySelectorAll("button.shrink-0");
		expect(removeButtons).toHaveLength(2);

		fireEvent.click(removeButtons[0] as HTMLButtonElement);

		expect(
			await screen.findAllByPlaceholderText("Enter instruction step"),
		).toHaveLength(1);
	});

	it("updates instruction text and opens the file picker", () => {
		const clickSpy = vi
			.spyOn(HTMLInputElement.prototype, "click")
			.mockImplementation(() => {});
		formSeed = {
			...formSeed,
			instructions: [""],
			secondaryMuscleIds: ["muscle-2"],
		};
		adminDataSeed = {
			equipment: [{ id: "equipment-1", name: "Barbell" }],
			categories: [{ id: "category-1", name: "Chest" }],
			muscleGroups: [
				{ id: "muscle-1", name: "Pectorals" },
				{ id: "muscle-2", name: "Delts" },
			],
		};

		render(<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />);

		fireEvent.change(screen.getByPlaceholderText("Enter instruction step"), {
			target: { value: "Brace the core" },
		});
		expect(screen.getByDisplayValue("Brace the core")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Add Step" }));
		expect(
			screen.getAllByPlaceholderText("Enter instruction step"),
		).toHaveLength(2);

		fireEvent.click(screen.getByRole("button", { name: "Add Images" }));
		expect(clickSpy).toHaveBeenCalledTimes(1);

		clickSpy.mockRestore();
	});

	it("validates category and primary muscle requirements in order", async () => {
		formSeed = {
			...formSeed,
			name: "Bench Press",
			categoryId: "",
			primaryMuscleIds: [],
		};
		const onClose = vi.fn();

		render(<ExerciseFormModal open onClose={onClose} exercise={undefined} />);

		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(await screen.findByText("Category is required")).toBeInTheDocument();
		expect(mockCreateExercise).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("requires at least one primary muscle when the rest of the form is valid", async () => {
		formSeed = {
			...formSeed,
			name: "Bench Press",
			categoryId: "category-1",
			primaryMuscleIds: [],
		};
		const onClose = vi.fn();

		render(<ExerciseFormModal open onClose={onClose} exercise={undefined} />);

		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(
			await screen.findByText("At least one primary muscle is required"),
		).toBeInTheDocument();
		expect(mockCreateExercise).not.toHaveBeenCalled();
		expect(mockUpdateExercise).not.toHaveBeenCalled();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("creates a new exercise without uploads and closes on success", async () => {
		imageSeed = [];
		const onClose = vi.fn();

		render(<ExerciseFormModal open onClose={onClose} exercise={undefined} />);

		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		await waitFor(() => {
			expect(mockCreateExercise).toHaveBeenCalledWith({
				name: "Bench Press",
				equipmentId: "equipment-1",
				categoryId: "category-1",
				level: "intermediate",
				force: "push",
				mechanic: "compound",
				primaryMuscleIds: ["muscle-1"],
				secondaryMuscleIds: ["muscle-2"],
				instructions: ["Set up"],
				imageUrls: [],
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
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

	it("surfaces non-error update failures with the generic fallback", async () => {
		mockUpdateExercise.mockRejectedValueOnce("update failed");
		imageSeed = [];
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
					instructions: ["Set up"],
					imageUrls: [],
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		expect(
			await screen.findByText("Failed to update exercise"),
		).toBeInTheDocument();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("surfaces create errors without closing the modal", async () => {
		mockCreateExercise.mockRejectedValueOnce(new Error("create failed"));
		imageSeed = [];
		const onClose = vi.fn();

		render(<ExerciseFormModal open onClose={onClose} exercise={undefined} />);

		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(await screen.findByText("create failed")).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("surfaces non-error create failures with the generic fallback", async () => {
		mockCreateExercise.mockRejectedValueOnce("create failed");
		imageSeed = [];

		render(<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />);

		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(
			await screen.findByText("Failed to create exercise"),
		).toBeInTheDocument();
	});

	it("adds uploaded files through the image queue and clears the file input", () => {
		const { container } = render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);
		const file = new File(["image"], "extra.jpg", { type: "image/jpeg" });
		const input = container.querySelector('input[type="file"]');

		expect(input).toBeTruthy();
		fireEvent.change(input as HTMLInputElement, {
			target: { files: [file] },
		});

		expect(mockAddFiles).toHaveBeenCalledWith([file]);
	});

	it("removes existing images from the queue", () => {
		const { container } = render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		const removeButtons = container.querySelectorAll(
			"button.absolute.top-1.right-1",
		);

		expect(removeButtons).toHaveLength(2);
		fireEvent.click(removeButtons[0]);

		expect(mockRemoveImage).toHaveBeenCalledWith(0);
	});

	it("exercises the hidden muscle and instruction helper branches", () => {
		formSeed = {
			...formSeed,
			instructions: ["Set up"],
			primaryMuscleIds: [],
			secondaryMuscleIds: [],
		};

		render(<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />);

		expect(latestFormState).toBeDefined();
		act(() => {
			latestFormState.toggleMuscle("muscle-1", true, true);
			latestFormState.toggleMuscle("muscle-1", true, false);
			latestFormState.toggleMuscle("muscle-2", false, true);
			latestFormState.toggleMuscle("muscle-2", false, false);
			latestFormState.removeInstruction(0);
		});

		expect(
			screen.getAllByPlaceholderText("Enter instruction step"),
		).toHaveLength(1);
	});

	it("fires the select and muscle chip callbacks through the rendered controls", () => {
		adminDataSeed = {
			equipment: [
				{ id: "equipment-1", name: "Barbell" },
				{ id: "equipment-2", name: "Dumbbell" },
			],
			categories: [{ id: "category-1", name: "Chest" }],
			muscleGroups: [
				{ id: "muscle-1", name: "Pectorals" },
				{ id: "muscle-2", name: "Delts" },
			],
		};
		formSeed = {
			...formSeed,
			equipmentId: "equipment-1",
			categoryId: "category-1",
			level: "intermediate",
			force: "push",
			mechanic: "compound",
			primaryMuscleIds: [],
			secondaryMuscleIds: [],
		};

		render(<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />);

		fireEvent.click(screen.getByRole("button", { name: "Chest" }));
		fireEvent.click(screen.getByRole("button", { name: "Beginner" }));
		fireEvent.click(screen.getByRole("button", { name: "Barbell" }));
		fireEvent.click(screen.getByRole("button", { name: "Push" }));
		fireEvent.click(screen.getByRole("button", { name: "Compound" }));

		expect(latestFormState?.categoryId).toBe("category-1");
		expect(latestFormState?.level).toBe("beginner");
		expect(latestFormState?.equipmentId).toBe("equipment-1");
		expect(latestFormState?.force).toBe("push");
		expect(latestFormState?.mechanic).toBe("compound");

		fireEvent.click(screen.getAllByRole("button", { name: "Pectorals" })[0]);
		expect(latestFormState?.primaryMuscleIds).toEqual(["muscle-1"]);
		fireEvent.click(screen.getAllByRole("button", { name: "Pectorals" })[1]);
		expect(latestFormState?.primaryMuscleIds).toEqual([]);

		fireEvent.click(screen.getAllByRole("button", { name: "Delts" })[1]);
		expect(latestFormState?.secondaryMuscleIds).toEqual([]);
	});
});
