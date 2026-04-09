import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SetGroupWithRelations, Units } from "@/lib/types";
import { ListView, SetType } from "@/lib/types";
import { WorkoutSetGroup } from "./workout-set-group";

const mockCreateSet = vi.fn();
const mockReorderSets = vi.fn();
const mockBulkEditSetGroup = vi.fn();
const mockUpdateSetGroup = vi.fn();
const mockDeleteSetGroup = vi.fn();
const mockSetNodeRef = vi.fn();

vi.mock("@/hooks", () => ({
	useCreateSet: () => ({
		mutateAsync: mockCreateSet,
	}),
	useReorderSets: () => ({
		mutateAsync: mockReorderSets,
	}),
	useBulkEditSetGroup: () => ({
		mutateAsync: mockBulkEditSetGroup,
	}),
	useUpdateSetGroup: () => ({
		mutateAsync: mockUpdateSetGroup,
	}),
	useDeleteSetGroup: () => ({
		mutateAsync: mockDeleteSetGroup,
	}),
}));

vi.mock("@dnd-kit/core", () => ({
	DndContext: ({
		children,
		onDragEnd,
	}: {
		children: ReactNode;
		onDragEnd?: (event: {
			active: { id: string };
			over: { id: string } | null;
		}) => void;
	}) => (
		<div>
			{children}
			<button
				type="button"
				onClick={() =>
					onDragEnd?.({ active: { id: "set-1" }, over: { id: "set-2" } })
				}
			>
				Trigger drag end
			</button>
			<button
				type="button"
				onClick={() =>
					onDragEnd?.({ active: { id: "set-1" }, over: { id: "set-1" } })
				}
			>
				Trigger noop drag end
			</button>
		</div>
	),
	KeyboardSensor: class KeyboardSensor {},
	MouseSensor: class MouseSensor {},
	TouchSensor: class TouchSensor {},
	useSensor: () => ({}),
	useSensors: (...sensors: unknown[]) => sensors,
}));

vi.mock("@dnd-kit/sortable", () => ({
	arrayMove: <T,>(items: T[], oldIndex: number, newIndex: number) => {
		const next = [...items];
		const [moved] = next.splice(oldIndex, 1);
		next.splice(newIndex, 0, moved);
		return next;
	},
	SortableContext: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	useSortable: () => ({
		attributes: {},
		listeners: {},
		setNodeRef: mockSetNodeRef,
		transform: null,
		transition: undefined,
	}),
	verticalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/utilities", () => ({
	CSS: {
		Transform: {
			toString: () => "",
		},
	},
}));

vi.mock("@/components/exercises/exercise-detail-modal", () => ({
	ExerciseDetailModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div>
				exercise-detail-open
				<button type="button" onClick={onClose}>
					Close detail
				</button>
			</div>
		) : null,
}));

vi.mock("@/components/exercises/replace-exercise-modal", () => ({
	ReplaceExerciseModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div>
				replace-exercise-open
				<button type="button" onClick={onClose}>
					Close replace
				</button>
			</div>
		) : null,
}));

vi.mock("./workout-set-row", () => ({
	WorkoutSetRow: ({ setNum, set }: { setNum: number; set: { id: string } }) => (
		<div>{`set-row-${set.id}-${setNum}`}</div>
	),
}));

const mockUnits: Units = {
	repetitionUnits: [{ id: "rep", name: "Reps" }],
	weightUnits: [{ id: "weight", name: "lb" }],
};

const buildSetGroup = ({
	exercise,
	completed,
	comment,
	setIds = ["set-1"],
}: {
	exercise: {
		id: string;
		name: string;
		imageUrl: string | null | undefined;
	} | null;
	completed: boolean;
	comment?: string;
	setIds?: string[];
}): SetGroupWithRelations => ({
	id: "group-1",
	userId: "user-1",
	routineDayId: null,
	sessionId: "session-1",
	type: "NORMAL",
	order: 0,
	comment: comment ?? null,
	sets: setIds.map((setId, index) => ({
		id: setId,
		userId: "user-1",
		setGroupId: "group-1",
		exerciseId: exercise?.id ?? "unknown-exercise-id",
		type: SetType.NORMAL,
		order: index,
		reps: 8,
		repetitionUnitId: "rep",
		weight: 135,
		weightUnitId: "weight",
		restTime: 90,
		completed,
		exercise,
		repetitionUnit: { id: "rep", name: "Reps" },
		weightUnit: { id: "weight", name: "lb" },
	})),
});

describe("WorkoutSetGroup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateSet.mockResolvedValue({});
		mockReorderSets.mockResolvedValue({});
		mockBulkEditSetGroup.mockResolvedValue({});
		mockUpdateSetGroup.mockResolvedValue({});
		mockDeleteSetGroup.mockResolvedValue({});
	});

	it("shows unknown exercise branch and does not add a set without an exercise", () => {
		const setGroup = buildSetGroup({ exercise: null, completed: false });

		render(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={setGroup}
				isReorderActive={false}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		expect(screen.getByText("Unknown exercise")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Replace with similar exercise" }),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Add Set" }));
		expect(mockCreateSet).not.toHaveBeenCalled();
	});

	it("adds sets and opens bulk edit/comment/delete controls", async () => {
		const setGroup = buildSetGroup({
			exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
			completed: false,
			comment: "Squeeze at the top",
		});

		render(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={setGroup}
				isReorderActive={false}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Add Set" }));
		await waitFor(() => {
			expect(mockCreateSet).toHaveBeenCalledWith({
				setGroupId: "group-1",
				exerciseId: "exercise-1",
			});
		});

		fireEvent.click(screen.getByRole("button", { name: "Bulk edit sets" }));
		expect(
			screen.getByRole("heading", { name: "Bulk Update Sets" }),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		fireEvent.click(screen.getByRole("button", { name: "Add comment" }));
		expect(
			screen.getByRole("heading", { name: "Update Set Comment" }),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		fireEvent.click(screen.getByRole("button", { name: "Delete exercise" }));
		expect(
			screen.getByRole("heading", { name: "Delete Exercise" }),
		).toBeInTheDocument();
	});

	it("auto-collapses when all sets become completed in current-session view", async () => {
		const { rerender } = render(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={buildSetGroup({
					exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
					completed: false,
				})}
				isReorderActive={false}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: "Add Set" })).toBeInTheDocument();

		rerender(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={buildSetGroup({
					exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
					completed: true,
				})}
				isReorderActive={false}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.queryByRole("button", { name: "Add Set" }),
			).not.toBeInTheDocument();
		});
	});

	it("wires drag-end sorting to reorder-set mutation with new set order", async () => {
		const setGroup = buildSetGroup({
			exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
			completed: false,
			setIds: ["set-1", "set-2"],
		});

		render(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={setGroup}
				isReorderActive={false}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Trigger drag end" }));

		await waitFor(() => {
			expect(mockReorderSets).toHaveBeenCalledWith({
				setGroupId: "group-1",
				setIds: ["set-2", "set-1"],
			});
		});
	});

	it("hides exercise actions while reorder mode is active", () => {
		const setGroup = buildSetGroup({
			exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
			completed: false,
		});

		render(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={setGroup}
				isReorderActive
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		expect(
			screen.queryByRole("button", {
				name: "Replace with similar exercise",
			}),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "View exercise details" }),
		).not.toBeInTheDocument();
	});

	it("opens and closes the exercise detail and replace modals", () => {
		const setGroup = buildSetGroup({
			exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
			completed: false,
		});

		render(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={setGroup}
				isReorderActive={false}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "View exercise details" }),
		);
		expect(screen.getByText("exercise-detail-open")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Close detail" }));
		expect(screen.queryByText("exercise-detail-open")).not.toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: "Replace with similar exercise" }),
		);
		expect(screen.getByText("replace-exercise-open")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Close replace" }));
		expect(screen.queryByText("replace-exercise-open")).not.toBeInTheDocument();
	});

	it("toggles the group open state and closes the delete modal", () => {
		const setGroup = buildSetGroup({
			exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
			completed: false,
		});

		render(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={setGroup}
				isReorderActive={false}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: "Add Set" })).toBeInTheDocument();

		fireEvent.click(screen.getByText("Barbell Row"));
		expect(
			screen.queryByRole("button", { name: "Add Set" }),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByText("Barbell Row"));
		expect(screen.getByRole("button", { name: "Add Set" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Delete exercise" }));
		expect(
			screen.getByRole("heading", { name: "Delete Exercise" }),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "No" }));
		expect(
			screen.queryByRole("heading", { name: "Delete Exercise" }),
		).not.toBeInTheDocument();
	});

	it("ignores drag end events that do not change order and shows the singular set label", async () => {
		const setGroup = buildSetGroup({
			exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
			completed: false,
			setIds: ["set-1"],
		});

		render(
			<WorkoutSetGroup
				view={ListView.CurrentSession}
				setGroup={setGroup}
				isReorderActive={false}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		expect(screen.getByText("1 set")).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: "Trigger noop drag end" }),
		);
		await waitFor(() => {
			expect(mockReorderSets).not.toHaveBeenCalled();
		});
	});
});
