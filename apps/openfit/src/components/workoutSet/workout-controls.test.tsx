import { userEvent } from "@vitest/browser/context";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	afterEach(() => {
		vi.useRealTimers();
	});

	it("bulk edits reps, weight, units, and rest time", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<BulkEditSetModal
				open
				onClose={onClose}
				setGroup={setGroup}
				units={units}
			/>,
		);

		await screen.getByPlaceholder("8").fill("12");
		await screen.getByPlaceholder("135").fill("155");
		await screen.getByPlaceholder("1:30").fill("2:15");
		await userEvent.click(screen.getByRole("button", { name: "Reps" }));
		await userEvent.click(screen.getByRole("button", { name: "lbs" }));
		await userEvent.click(screen.getByRole("button", { name: "Update" }));

		await vi.waitFor(() => {
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

	it("leaves bulk-edit fields unchanged when the inputs are blank", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<BulkEditSetModal
				open
				onClose={onClose}
				setGroup={setGroup}
				units={units}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Update" }));

		await vi.waitFor(() => {
			expect(mockBulkEditSetGroup).toHaveBeenCalledWith({
				id: "group-1",
				reps: undefined,
				weight: undefined,
				repetitionUnitId: "rep",
				weightUnitId: "lb",
				restTime: undefined,
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("clears a set comment when the textarea is emptied", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<EditSetCommentModal
				open
				onClose={onClose}
				setGroup={{ ...setGroup, comment: "Tempo work" }}
			/>,
		);

		await screen.getByLabelText("Comment").fill("");
		await userEvent.click(screen.getByRole("button", { name: "Update" }));

		await vi.waitFor(() => {
			expect(mockUpdateSetGroup).toHaveBeenCalledWith({
				id: "group-1",
				comment: undefined,
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("opens the workout timer and completes the set", async () => {
		const onComplete = vi.fn().mockResolvedValue(undefined);

		const screen = await render(
			<WorkoutTimer set={set} onComplete={onComplete} />,
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Toggle workout timer" }),
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Mark as Completed" }),
		);

		await vi.waitFor(() => {
			expect(onComplete).toHaveBeenCalledTimes(1);
		});
	});

	it("adjusts the workout timer controls", async () => {
		const onComplete = vi.fn().mockResolvedValue(undefined);

		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-08T12:00:00.000Z"));
		mockCountdown.isRunning = false;
		mockCountdown.totalSeconds = 45;

		const screen = await render(
			<WorkoutTimer set={set} onComplete={onComplete} />,
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Toggle workout timer" }),
		);
		await userEvent.click(
			screen.getByRole("button", {
				name: "Decrease workout timer by 10 seconds",
			}),
		);
		await userEvent.click(
			screen.getByRole("button", {
				name: "Increase workout timer by 10 seconds",
			}),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Start workout timer" }),
		);

		expect(mockCountdown.restart).toHaveBeenNthCalledWith(
			1,
			new Date("2026-04-08T12:00:08.000Z"),
			false,
		);
		expect(mockCountdown.restart).toHaveBeenNthCalledWith(
			2,
			new Date("2026-04-08T12:00:35.000Z"),
			false,
		);
		expect(mockCountdown.restart).toHaveBeenNthCalledWith(
			3,
			new Date("2026-04-08T12:00:55.000Z"),
			false,
		);
		expect(mockCountdown.start).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	it("pauses the workout timer when it is already running", async () => {
		const onComplete = vi.fn().mockResolvedValue(undefined);

		mockCountdown.isRunning = true;
		mockCountdown.totalSeconds = 45;

		const screen = await render(
			<WorkoutTimer set={set} onComplete={onComplete} />,
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Toggle workout timer" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Pause workout timer" }),
		);

		expect(mockCountdown.pause).toHaveBeenCalledTimes(1);
	});

	it("falls back to the set number for an unknown set type and updates the type selection", async () => {
		const screen = await render(
			<SetTypeMenu
				set={{
					...set,
					type: "SUPERSET" as SetWithRelations["type"],
				}}
				setNum={3}
			/>,
		);

		await expect.element(screen.getByText("3")).toBeInTheDocument();
		await userEvent.click(screen.getByText("Dropset"));

		await vi.waitFor(() => {
			expect(mockUpdateSet).toHaveBeenCalledWith({
				id: "set-1",
				type: SetType.DROPSET,
			});
		});
	});
});
