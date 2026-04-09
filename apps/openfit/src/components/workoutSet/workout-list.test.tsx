import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SetGroupWithRelations, Units } from "@/lib/types";
import { ListView, SetType } from "@/lib/types";
import { WorkoutList } from "./workout-list";

const mockReorderSetGroups = vi.fn();
const mockTimerRestart = vi.fn();

vi.mock("@/hooks", () => ({
	useCountdownTimer: () => ({
		isRunning: false,
		totalSeconds: 90,
		start: vi.fn(),
		pause: vi.fn(),
		restart: mockTimerRestart,
	}),
	useReorderSetGroups: () => ({
		mutateAsync: mockReorderSetGroups,
	}),
}));

vi.mock("@/components/routines/add-exercise-row", () => ({
	AddExerciseRow: ({ isSession }: { isSession: boolean }) => (
		<div data-testid="add-exercise-row">{String(isSession)}</div>
	),
}));

vi.mock("@/components/sessions/rest-timer", () => ({
	RestTimer: ({
		open,
		totalSeconds,
	}: {
		open: boolean;
		totalSeconds: number;
	}) =>
		open ? (
			<div data-testid="rest-timer">{totalSeconds}</div>
		) : (
			<div data-testid="rest-timer-closed" />
		),
}));

vi.mock("./workout-set-group", () => ({
	WorkoutSetGroup: ({
		setGroup,
		isReorderActive,
		startRestTimer,
	}: {
		setGroup: { id: string };
		isReorderActive: boolean;
		startRestTimer: (seconds: number) => void;
	}) => (
		<div>
			<div>{`group-${setGroup.id}-${String(isReorderActive)}`}</div>
			<button type="button" onClick={() => startRestTimer(75)}>
				Start rest
			</button>
		</div>
	),
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
					onDragEnd?.({ active: { id: "group-1" }, over: { id: "group-2" } })
				}
			>
				Trigger reorder
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
	verticalListSortingStrategy: {},
}));

const mockUnits: Units = {
	repetitionUnits: [],
	weightUnits: [],
};

const buildSetGroup = (id: string): SetGroupWithRelations =>
	({
		id,
		userId: "user-1",
		routineDayId: null,
		sessionId: "session-1",
		type: "NORMAL",
		order: 0,
		comment: null,
		sets: [
			{
				id: `${id}-set-1`,
				userId: "user-1",
				setGroupId: id,
				exerciseId: "exercise-1",
				type: SetType.NORMAL,
				order: 0,
				reps: 8,
				repetitionUnitId: "rep",
				weight: 135,
				weightUnitId: "weight",
				restTime: 75,
				completed: false,
				exercise: { id: "exercise-1", name: "Bench", imageUrl: null },
				repetitionUnit: { id: "rep", name: "Reps" },
				weightUnit: { id: "weight", name: "lb" },
			},
		],
	}) as SetGroupWithRelations;

describe("WorkoutList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockReorderSetGroups.mockResolvedValue({});
		mockTimerRestart.mockClear();
	});

	it("shows the empty state when there are no set groups", () => {
		render(
			<WorkoutList
				view={ListView.EditTemplate}
				setGroups={[]}
				units={mockUnits}
				sessionOrDayId="day-1"
			/>,
		);

		expect(screen.getByText("No exercises yet")).toBeInTheDocument();
		expect(screen.getByTestId("add-exercise-row")).toHaveTextContent("false");
		expect(screen.queryByTestId("rest-timer")).not.toBeInTheDocument();
	});

	it("toggles reorder mode, starts the rest timer, and reorders groups", async () => {
		render(
			<WorkoutList
				view={ListView.CurrentSession}
				setGroups={[buildSetGroup("group-1"), buildSetGroup("group-2")]}
				units={mockUnits}
				sessionOrDayId="day-1"
			/>,
		);

		expect(screen.getByTestId("add-exercise-row")).toHaveTextContent("true");
		expect(screen.getByText("group-group-1-false")).toBeInTheDocument();
		expect(screen.getByText("group-group-2-false")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("switch", { name: "Reorder exercises" }));

		expect(screen.getByText("group-group-1-true")).toBeInTheDocument();
		expect(screen.getByText("group-group-2-true")).toBeInTheDocument();

		fireEvent.click(screen.getAllByRole("button", { name: "Start rest" })[0]);

		await waitFor(() => {
			expect(mockTimerRestart).toHaveBeenCalled();
		});
		expect(screen.getByTestId("rest-timer")).toHaveTextContent("75");

		fireEvent.click(screen.getByRole("button", { name: "Trigger reorder" }));

		await waitFor(() => {
			expect(mockReorderSetGroups).toHaveBeenCalledWith({
				setGroupIds: ["group-2", "group-1"],
			});
		});
	});
});
