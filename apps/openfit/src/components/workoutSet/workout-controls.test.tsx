import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	SetGroupWithRelations,
	SetWithRelations,
	Units,
} from "@/lib/types";
import { SetType } from "@/lib/types";
import { BulkEditSetModal } from "./bulk-edit-set-modal";
import { EditSetCommentModal } from "./edit-set-comment-modal";
import { SetTypeMenu } from "./set-type-menu";
import { WorkoutTimer } from "./workout-timer";

const mockBulkEditSetGroup = vi.fn();
const mockUpdateSetGroup = vi.fn();
const mockUpdateSet = vi.fn();
const mockCountdown = {
	isRunning: false,
	totalSeconds: 45,
	start: vi.fn(),
	pause: vi.fn(),
	restart: vi.fn(),
};

dayjs.extend(duration);

vi.mock("@/hooks", () => ({
	useBulkEditSetGroup: () => ({ mutateAsync: mockBulkEditSetGroup }),
	useUpdateSetGroup: () => ({ mutateAsync: mockUpdateSetGroup }),
	useUpdateSet: () => ({ mutate: mockUpdateSet, mutateAsync: mockUpdateSet }),
	useCountdownTimer: () => mockCountdown,
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/progress-circle", () => ({
	ProgressCircle: ({ children }: { children?: ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("./rep-unit-menu", () => ({
	RepUnitMenu: ({
		label,
		units,
		onChange,
	}: {
		label: string;
		units: Units;
		onChange: (unit: Units["repetitionUnits"][number]) => void;
	}) => (
		<button
			type="button"
			onClick={() =>
				onChange(units.repetitionUnits[1] ?? units.repetitionUnits[0])
			}
		>
			{label}
		</button>
	),
}));

vi.mock("./weight-unit-menu", () => ({
	WeightUnitMenu: ({
		label,
		units,
		onChange,
	}: {
		label: string;
		units: Units;
		onChange: (unit: Units["weightUnits"][number]) => void;
	}) => (
		<button
			type="button"
			onClick={() => onChange(units.weightUnits[1] ?? units.weightUnits[0])}
		>
			{label}
		</button>
	),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
	DropdownMenuContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuItem: ({
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
	DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
		<>{children}</>
	),
}));

const units: Units = {
	repetitionUnits: [
		{ id: "rep", name: "Reps" },
		{ id: "seconds", name: "Seconds" },
	],
	weightUnits: [
		{ id: "lb", name: "lbs" },
		{ id: "kg", name: "kg" },
	],
};

const set: SetWithRelations = {
	id: "set-1",
	userId: "user-1",
	setGroupId: "group-1",
	exerciseId: "exercise-1",
	type: SetType.NORMAL,
	order: 0,
	reps: 8,
	repetitionUnitId: "rep",
	weight: 135,
	weightUnitId: "lb",
	restTime: 75,
	completed: false,
	exercise: { id: "exercise-1", name: "Bench", imageUrl: null },
	repetitionUnit: { id: "rep", name: "Reps" },
	weightUnit: { id: "lb", name: "lbs" },
} as SetWithRelations;

const setGroup: SetGroupWithRelations = {
	id: "group-1",
	userId: "user-1",
	routineDayId: null,
	sessionId: "session-1",
	type: "NORMAL",
	order: 0,
	comment: null,
	sets: [set],
} satisfies SetGroupWithRelations;

describe("workout controls", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockBulkEditSetGroup.mockResolvedValue({});
		mockUpdateSetGroup.mockResolvedValue({});
		mockUpdateSet.mockClear();
		mockCountdown.isRunning = false;
		mockCountdown.totalSeconds = 45;
	});

	it("bulk edits reps, weight, units, and rest time", async () => {
		const onClose = vi.fn();

		render(
			<BulkEditSetModal
				open
				onClose={onClose}
				setGroup={setGroup}
				units={units}
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText("8"), {
			target: { value: "12" },
		});
		fireEvent.change(screen.getByPlaceholderText("135"), {
			target: { value: "155" },
		});
		fireEvent.change(screen.getByPlaceholderText("1:30"), {
			target: { value: "2:15" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Reps" }));
		fireEvent.click(screen.getByRole("button", { name: "lbs" }));
		fireEvent.click(screen.getByRole("button", { name: "Update" }));

		await waitFor(() => {
			expect(mockBulkEditSetGroup).toHaveBeenCalledWith({
				id: "group-1",
				reps: 12,
				weight: 155,
				repetitionUnitId: "seconds",
				weightUnitId: "kg",
				restTime: 135,
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("clears a set comment when the textarea is emptied", async () => {
		const onClose = vi.fn();

		render(
			<EditSetCommentModal
				open
				onClose={onClose}
				setGroup={{ ...setGroup, comment: "Tempo work" }}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Comment"), {
			target: { value: "" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Update" }));

		await waitFor(() => {
			expect(mockUpdateSetGroup).toHaveBeenCalledWith({
				id: "group-1",
				comment: undefined,
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("opens the workout timer and completes the set", async () => {
		const onComplete = vi.fn().mockResolvedValue(undefined);

		render(<WorkoutTimer set={set} onComplete={onComplete} />);
		fireEvent.click(screen.getAllByRole("button")[0]);

		fireEvent.click(screen.getByRole("button", { name: "Mark as Completed" }));

		await waitFor(() => {
			expect(onComplete).toHaveBeenCalledTimes(1);
		});
	});

	it("falls back to the set number for an unknown set type and updates the type selection", async () => {
		render(
			<SetTypeMenu
				set={{
					...set,
					type: "SUPERSET" as SetWithRelations["type"],
				}}
				setNum={3}
			/>,
		);

		expect(screen.getByText("3")).toBeInTheDocument();
		fireEvent.click(screen.getByText("Dropset"));

		await waitFor(() => {
			expect(mockUpdateSet).toHaveBeenCalledWith({
				id: "set-1",
				type: SetType.DROPSET,
			});
		});
	});
});
