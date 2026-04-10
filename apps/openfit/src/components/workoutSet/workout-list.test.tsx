import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
			<button
				type="button"
				onClick={() =>
					onDragEnd?.({ active: { id: "group-1" }, over: { id: "group-1" } })
				}
			>
				Trigger noop reorder
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

	it("shows the empty state when there are no set groups", async () => {
		const screen = await render(
			<WorkoutList
				view={ListView.EditTemplate}
				setGroups={[]}
				units={mockUnits}
				sessionOrDayId="day-1"
			/>,
		);

		await expect
			.element(screen.getByText("No exercises yet"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("add-exercise-row"))
			.toHaveTextContent("false");
		await expect
			.element(screen.getByTestId("rest-timer"))
			.not.toBeInTheDocument();
	});

	it("toggles reorder mode, starts the rest timer, and reorders groups", async () => {
		const screen = await render(
			<WorkoutList
				view={ListView.CurrentSession}
				setGroups={[buildSetGroup("group-1"), buildSetGroup("group-2")]}
				units={mockUnits}
				sessionOrDayId="day-1"
			/>,
		);

		await expect
			.element(screen.getByTestId("add-exercise-row"))
			.toHaveTextContent("true");
		await expect
			.element(screen.getByText("group-group-1-false"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("group-group-2-false"))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("switch", { name: "Reorder exercises" }),
		);

		await expect
			.element(screen.getByText("group-group-1-true"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("group-group-2-true"))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getAllByRole("button", { name: "Start rest" })[0],
		);

		await vi.waitFor(() => {
			expect(mockTimerRestart).toHaveBeenCalled();
		});
		await expect
			.element(screen.getByTestId("rest-timer"))
			.toHaveTextContent("75");

		await userEvent.click(
			screen.getByRole("button", { name: "Trigger reorder" }),
		);

		await vi.waitFor(() => {
			expect(mockReorderSetGroups).toHaveBeenCalledWith({
				setGroupIds: ["group-2", "group-1"],
			});
		});
	});

	it("ignores drag events that do not move a set group", async () => {
		const screen = await render(
			<WorkoutList
				view={ListView.EditTemplate}
				setGroups={[buildSetGroup("group-1"), buildSetGroup("group-2")]}
				units={mockUnits}
				sessionOrDayId="day-1"
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Trigger noop reorder" }),
		);

		await vi.waitFor(() => {
			expect(mockReorderSetGroups).not.toHaveBeenCalled();
		});
	});
});
