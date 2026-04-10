import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { SetWithRelations, Units } from "@/lib/types";
import { ListView, SetType } from "@/lib/types";
import { WorkoutSetRow } from "./workout-set-row";

const mockUpdateSet = vi.fn();
const mockDeleteSet = vi.fn();

vi.mock("@dnd-kit/sortable", () => ({
	useSortable: () => ({
		attributes: {},
		listeners: {},
		setNodeRef: vi.fn(),
		transform: null,
		transition: undefined,
	}),
}));

vi.mock("@dnd-kit/utilities", () => ({
	CSS: {
		Transform: {
			toString: () => "",
		},
	},
}));

vi.mock("@/hooks", () => ({
	useUpdateSet: () => ({
		mutate: mockUpdateSet,
		mutateAsync: mockUpdateSet,
	}),
	useDeleteSet: () => ({
		mutate: mockDeleteSet,
	}),
}));

vi.mock("./workout-timer", () => ({
	WorkoutTimer: ({ onComplete }: { onComplete: () => Promise<void> }) => (
		<button type="button" onClick={() => void onComplete()}>
			Complete timer
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

const mockUnits: Units = {
	repetitionUnits: [
		{ id: "rep", name: "Reps" },
		{ id: "seconds", name: "Seconds" },
	],
	weightUnits: [
		{ id: "lb", name: "lbs" },
		{ id: "kg", name: "kg" },
	],
};

const buildSet = (
	overrides: Partial<SetWithRelations> = {},
): SetWithRelations =>
	({
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
		exercise: { id: "exercise-1", name: "Barbell Row", imageUrl: null },
		repetitionUnit: { id: "rep", name: "Reps" },
		weightUnit: { id: "lb", name: "lbs" },
		...overrides,
	}) as SetWithRelations;

describe("WorkoutSetRow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateSet.mockClear();
		mockDeleteSet.mockClear();
	});

	it("updates reps, weights, and unit selectors before deleting the set", async () => {
		const screen = await render(
			<WorkoutSetRow
				view={ListView.EditTemplate}
				set={buildSet()}
				setNum={2}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		await screen.getByRole("textbox", { name: "Reps" }).fill("10");
		await userEvent.tab();

		expect(mockUpdateSet).toHaveBeenCalledWith({ id: "set-1", reps: 10 });

		await screen.getByRole("textbox", { name: "Weight" }).fill("155");
		await userEvent.tab();

		expect(mockUpdateSet).toHaveBeenCalledWith({ id: "set-1", weight: 155 });

		await userEvent.click(screen.getByText("Dropset"));
		expect(mockUpdateSet).toHaveBeenCalledWith({
			id: "set-1",
			type: SetType.DROPSET,
		});

		await userEvent.click(screen.getByText("Seconds"));
		expect(mockUpdateSet).toHaveBeenCalledWith({
			id: "set-1",
			repetitionUnitId: "seconds",
		});

		await userEvent.click(screen.getByText("kg"));
		expect(mockUpdateSet).toHaveBeenCalledWith({
			id: "set-1",
			weightUnitId: "kg",
		});

		await userEvent.click(screen.getByRole("button", { name: "Delete set" }));
		expect(mockDeleteSet).toHaveBeenCalledWith("set-1");
	});

	it("marks timed sets complete and starts rest timer in current session", async () => {
		const startRestTimer = vi.fn();

		const screen = await render(
			<WorkoutSetRow
				view={ListView.CurrentSession}
				set={buildSet({
					repetitionUnit: { id: "seconds", name: "Seconds" },
					repetitionUnitId: "seconds",
				})}
				setNum={1}
				units={mockUnits}
				startRestTimer={startRestTimer}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Complete timer" }),
		);

		await vi.waitFor(() => {
			expect(mockUpdateSet).toHaveBeenCalledWith({
				id: "set-1",
				completed: true,
			});
		});
		expect(startRestTimer).toHaveBeenCalledWith(75);
	});

	it("marks non-timed sets complete with the checkbox branch", async () => {
		const startRestTimer = vi.fn();

		const screen = await render(
			<WorkoutSetRow
				view={ListView.CurrentSession}
				set={buildSet({
					repetitionUnit: { id: "rep", name: "Reps" },
					repetitionUnitId: "rep",
				})}
				setNum={1}
				units={mockUnits}
				startRestTimer={startRestTimer}
			/>,
		);

		await userEvent.click(
			screen.getByRole("checkbox", { name: "Mark as Completed" }),
		);

		expect(mockUpdateSet).toHaveBeenCalledWith({
			id: "set-1",
			completed: true,
		});
		expect(startRestTimer).toHaveBeenCalledWith(75);
	});

	it("disables completed rows in current session view", async () => {
		const screen = await render(
			<WorkoutSetRow
				view={ListView.CurrentSession}
				set={buildSet({
					completed: true,
					repetitionUnit: { id: "seconds", name: "Seconds" },
					repetitionUnitId: "seconds",
				})}
				setNum={1}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByRole("textbox", { name: "Reps" }))
			.toBeDisabled();
		await expect
			.element(screen.getByRole("textbox", { name: "Weight" }))
			.toBeDisabled();
		await expect
			.element(screen.getByRole("checkbox", { name: "Mark as Completed" }))
			.toBeChecked();
	});

	it("treats non-numeric inputs as zero and skips the rest timer when there is no rest", async () => {
		const startRestTimer = vi.fn();

		const screen = await render(
			<WorkoutSetRow
				view={ListView.CurrentSession}
				set={buildSet({
					restTime: 0,
					repetitionUnit: { id: "rep", name: "Reps" },
					repetitionUnitId: "rep",
				})}
				setNum={1}
				units={mockUnits}
				startRestTimer={startRestTimer}
			/>,
		);

		await screen.getByRole("textbox", { name: "Reps" }).fill("abc");
		await userEvent.tab();
		await userEvent.click(
			screen.getByRole("checkbox", { name: "Mark as Completed" }),
		);

		expect(mockUpdateSet).toHaveBeenCalledWith({ id: "set-1", reps: 0 });
		expect(startRestTimer).not.toHaveBeenCalled();
	});

	it("can uncheck a completed current-session set without starting rest", async () => {
		const startRestTimer = vi.fn();

		const screen = await render(
			<WorkoutSetRow
				view={ListView.CurrentSession}
				set={buildSet({
					completed: true,
					restTime: 75,
					repetitionUnit: { id: "rep", name: "Reps" },
					repetitionUnitId: "rep",
				})}
				setNum={1}
				units={mockUnits}
				startRestTimer={startRestTimer}
			/>,
		);

		await userEvent.click(
			screen.getByRole("checkbox", { name: "Mark as Completed" }),
		);

		expect(mockUpdateSet).toHaveBeenCalledWith({
			id: "set-1",
			completed: false,
		});
		expect(startRestTimer).not.toHaveBeenCalled();
	});

	it("falls back to default unit labels when set units are missing", async () => {
		const screen = await render(
			<WorkoutSetRow
				view={ListView.EditTemplate}
				set={buildSet({
					repetitionUnit: undefined,
					repetitionUnitId: undefined,
					weightUnit: undefined,
					weightUnitId: undefined,
				})}
				setNum={1}
				units={mockUnits}
				startRestTimer={vi.fn()}
			/>,
		);

		await expect.element(screen.getByText("reps").nth(0)).toBeInTheDocument();
		await expect.element(screen.getByText("lbs").nth(0)).toBeInTheDocument();
	});
});
