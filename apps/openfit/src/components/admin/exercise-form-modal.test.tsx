import { page, userEvent } from "@vitest/browser/context";
import {
	act,
	createContext,
	type ReactNode,
	useContext,
	useState,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	it("shows a loading state while exercise metadata is still loading", async () => {
		adminDataSeed = {
			equipment: undefined as never,
			categories: undefined as never,
			muscleGroups: undefined as never,
		};

		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		await expect.element(screen.getByText("Name *")).not.toBeInTheDocument();
		await expect.element(screen.getByText("Add Exercise")).toBeInTheDocument();
	});

	it("shows a no-preview placeholder for blank image entries and ignores empty file selections", async () => {
		imageSeed = [
			{
				type: "new",
				file: undefined as never,
				url: undefined as never,
			},
		];

		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		await expect.element(screen.getByText("No preview")).toBeInTheDocument();

		const fileInputEl =
			screen.container.querySelector<HTMLInputElement>('input[type="file"]');
		if (!fileInputEl) {
			throw new Error("Expected file input to exist");
		}
		const fileInput = page.elementLocator(fileInputEl);
		await expect.element(fileInput).toBeInTheDocument();

		// Simulate change event with no files selected
		fileInputEl.dispatchEvent(new Event("change", { bubbles: true }));

		expect(mockAddFiles).not.toHaveBeenCalled();
	});

	it("shows edit mode copy and a pending submit state", async () => {
		formSeed = {
			...formSeed,
			isPending: true,
			uploadProgress: "Uploading images (1/1)...",
		};

		const screen = await render(
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

		await expect.element(screen.getByText("Edit Exercise")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Update exercise details"))
			.toBeInTheDocument();
		await expect
			.element(
				screen.getByRole("button", { name: "Uploading images (1/1)..." }),
			)
			.toBeDisabled();
		await expect
			.element(screen.getByText("Uploading images (1/1)..."))
			.toBeInTheDocument();
	});

	it("shows validation errors before submitting", async () => {
		formSeed = {
			...formSeed,
			name: "",
			categoryId: "",
			primaryMuscleIds: [],
		};
		const onClose = vi.fn();

		const screen = await render(
			<ExerciseFormModal open onClose={onClose} exercise={undefined} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect
			.element(screen.getByText("Exercise name is required"))
			.toBeInTheDocument();
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

		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		expect(screen.getByPlaceholder("Enter instruction step")).toHaveLength(2);

		const removeButtons = screen.container.querySelectorAll("button.shrink-0");
		expect(removeButtons).toHaveLength(2);

		await userEvent.click(removeButtons[0] as HTMLButtonElement);

		expect(screen.getByPlaceholder("Enter instruction step")).toHaveLength(1);
	});

	it("updates instruction text and opens the file picker", async () => {
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

		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		await screen
			.getByPlaceholder("Enter instruction step")
			.fill("Brace the core");
		await expect
			.element(screen.getByPlaceholder("Enter instruction step"))
			.toHaveValue("Brace the core");

		await userEvent.click(screen.getByRole("button", { name: "Add Step" }));
		expect(screen.getByPlaceholder("Enter instruction step")).toHaveLength(2);

		await userEvent.click(screen.getByRole("button", { name: "Add Images" }));
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

		const screen = await render(
			<ExerciseFormModal open onClose={onClose} exercise={undefined} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect
			.element(screen.getByText("Category is required"))
			.toBeInTheDocument();
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

		const screen = await render(
			<ExerciseFormModal open onClose={onClose} exercise={undefined} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect
			.element(screen.getByText("At least one primary muscle is required"))
			.toBeInTheDocument();
		expect(mockCreateExercise).not.toHaveBeenCalled();
		expect(mockUpdateExercise).not.toHaveBeenCalled();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("creates a new exercise without uploads and closes on success", async () => {
		imageSeed = [];
		const onClose = vi.fn();

		const screen = await render(
			<ExerciseFormModal open onClose={onClose} exercise={undefined} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await vi.waitFor(() => {
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

		const screen = await render(
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

		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await vi.waitFor(() => {
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

		const screen = await render(
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

		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await expect
			.element(screen.getByText("Failed to update exercise"))
			.toBeInTheDocument();
		expect(mockUploadFile).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("surfaces create errors without closing the modal", async () => {
		mockCreateExercise.mockRejectedValueOnce(new Error("create failed"));
		imageSeed = [];
		const onClose = vi.fn();

		const screen = await render(
			<ExerciseFormModal open onClose={onClose} exercise={undefined} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect.element(screen.getByText("create failed")).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("surfaces non-error create failures with the generic fallback", async () => {
		mockCreateExercise.mockRejectedValueOnce("create failed");
		imageSeed = [];

		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect
			.element(screen.getByText("Failed to create exercise"))
			.toBeInTheDocument();
	});

	it("adds uploaded files through the image queue and clears the file input", async () => {
		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);
		const file = new File(["image"], "extra.jpg", { type: "image/jpeg" });
		const fileInputEl = screen.container.querySelector('input[type="file"]');
		expect(fileInputEl).toBeTruthy();
		const fileInput = page.elementLocator(fileInputEl as Element);

		await expect.element(fileInput).toBeInTheDocument();
		await userEvent.upload(fileInput, file);

		expect(mockAddFiles).toHaveBeenCalledWith([file]);
	});

	it("removes existing images from the queue", async () => {
		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		const removeButtons = screen.container.querySelectorAll(
			"button.absolute.top-1.right-1",
		);

		expect(removeButtons).toHaveLength(2);
		await userEvent.click(removeButtons[0]);

		expect(mockRemoveImage).toHaveBeenCalledWith(0);
	});

	it("exercises the hidden muscle and instruction helper branches", async () => {
		formSeed = {
			...formSeed,
			instructions: ["Set up"],
			primaryMuscleIds: [],
			secondaryMuscleIds: [],
		};

		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		expect(latestFormState).toBeDefined();
		act(() => {
			latestFormState.toggleMuscle("muscle-1", true, true);
			latestFormState.toggleMuscle("muscle-1", true, false);
			latestFormState.toggleMuscle("muscle-2", false, true);
			latestFormState.toggleMuscle("muscle-2", false, false);
			latestFormState.removeInstruction(0);
		});

		expect(screen.getByPlaceholder("Enter instruction step")).toHaveLength(1);
	});

	it("fires the select and muscle chip callbacks through the rendered controls", async () => {
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

		const screen = await render(
			<ExerciseFormModal open onClose={vi.fn()} exercise={undefined} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Chest" }));
		await userEvent.click(screen.getByRole("button", { name: "Beginner" }));
		await userEvent.click(screen.getByRole("button", { name: "Barbell" }));
		await userEvent.click(screen.getByRole("button", { name: "Push" }));
		await userEvent.click(screen.getByRole("button", { name: "Compound" }));

		expect(latestFormState?.categoryId).toBe("category-1");
		expect(latestFormState?.level).toBe("beginner");
		expect(latestFormState?.equipmentId).toBe("equipment-1");
		expect(latestFormState?.force).toBe("push");
		expect(latestFormState?.mechanic).toBe("compound");

		await userEvent.click(
			screen.getByRole("button", { name: "Pectorals" }).nth(0),
		);
		expect(latestFormState?.primaryMuscleIds).toEqual(["muscle-1"]);
		await userEvent.click(
			screen.getByRole("button", { name: "Pectorals" }).nth(1),
		);
		expect(latestFormState?.primaryMuscleIds).toEqual([]);
	});
});
