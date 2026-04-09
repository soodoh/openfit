import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { RoutineWithDays } from "@/lib/types";
import { RoutineModal } from "./routine-modal";

vi.mock("./routine-overview-tab", () => ({
	RoutineOverviewTab: ({
		onSelectDay,
		onDayAdded,
	}: {
		onSelectDay: (dayId: string) => void;
		onDayAdded?: (dayId: string) => void;
	}) => (
		<div>
			<div>Overview body</div>
			<button type="button" onClick={() => onSelectDay("day-2")}>
				Select day 2
			</button>
			<button type="button" onClick={() => onDayAdded?.("day-3")}>
				Add day 3
			</button>
		</div>
	),
}));

vi.mock("./routine-day-tab", () => ({
	RoutineDayTab: ({
		dayId,
		onDeleted,
	}: {
		dayId: string;
		onDeleted: () => void;
	}) => (
		<div>
			<div>{`Day tab ${dayId}`}</div>
			<button type="button" onClick={onDeleted}>
				Delete this day
			</button>
		</div>
	),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({
		children,
		open,
		onOpenChange,
	}: {
		children: ReactNode;
		open: boolean;
		onOpenChange?: (open: boolean) => void;
	}) =>
		open ? (
			<div>
				{children}
				<button type="button" onClick={() => onOpenChange?.(true)}>
					Open dialog
				</button>
				<button type="button" onClick={() => onOpenChange?.(false)}>
					Close dialog
				</button>
			</div>
		) : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

const mockRoutine: RoutineWithDays = {
	id: "routine-1",
	userId: "user-1",
	name: "Strength Plan",
	description: "Four week block",
	createdAt: new Date("2026-03-01T00:00:00.000Z"),
	updatedAt: new Date("2026-03-02T00:00:00.000Z"),
	routineDays: [
		{
			id: "day-1",
			routineId: "routine-1",
			userId: "user-1",
			description: "Pull",
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-01T00:00:00.000Z"),
			weekdays: [],
		},
		{
			id: "day-2",
			routineId: "routine-1",
			userId: "user-1",
			description: "Push",
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-01T00:00:00.000Z"),
			weekdays: [],
		},
	],
};

describe("RoutineModal", () => {
	it("falls back to overview when initialTab is invalid", () => {
		render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-does-not-exist"
			/>,
		);

		expect(screen.getByText("Overview body")).toBeInTheDocument();
		expect(screen.queryByText("Day tab day-1")).not.toBeInTheDocument();
	});

	it("renders the requested day tab when initialTab matches a routine day", () => {
		render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-day-2"
			/>,
		);

		expect(screen.getByText("Day tab day-2")).toBeInTheDocument();
		expect(screen.queryByText("Overview body")).not.toBeInTheDocument();
	});

	it("truncates long routine day names in the tab list", () => {
		const routine = {
			...mockRoutine,
			routineDays: [
				{
					...mockRoutine.routineDays[0],
					description: "An extremely long workout day name",
				},
			],
		};

		render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={routine}
				currentSession={undefined}
			/>,
		);

		expect(
			screen.getByRole("tab", { name: "Day 1: An extremely lo..." }),
		).toBeInTheDocument();
	});

	it("returns to overview when day-tab deletion callback fires", () => {
		render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-day-1"
			/>,
		);

		expect(screen.getByText("Day tab day-1")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Delete this day" }));
		expect(screen.getByText("Overview body")).toBeInTheDocument();
	});

	it("switches to a selected day from the overview tab", () => {
		render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Select day 2" }));
		expect(screen.getByText("Day tab day-2")).toBeInTheDocument();
		expect(screen.queryByText("Overview body")).not.toBeInTheDocument();
	});

	it("switches to a newly added day from the overview tab", () => {
		const updatedRoutine = {
			...mockRoutine,
			routineDays: [
				...mockRoutine.routineDays,
				{
					id: "day-3",
					routineId: "routine-1",
					userId: "user-1",
					description: "Legs",
					createdAt: new Date("2026-03-01T00:00:00.000Z"),
					updatedAt: new Date("2026-03-01T00:00:00.000Z"),
					weekdays: [],
				},
			],
		};

		const { rerender } = render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);

		rerender(
			<RoutineModal
				open={false}
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);
		rerender(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="overview"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Add day 3" }));
		rerender(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={updatedRoutine}
				currentSession={undefined}
				initialTab="overview"
			/>,
		);
		expect(screen.getByText("Day tab day-3")).toBeInTheDocument();
		expect(screen.queryByText("Overview body")).not.toBeInTheDocument();
	});

	it("resets to the initial tab when the modal is reopened", () => {
		const { rerender } = render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-day-1"
			/>,
		);

		expect(screen.getByText("Day tab day-1")).toBeInTheDocument();

		rerender(
			<RoutineModal
				open={false}
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="overview"
			/>,
		);
		rerender(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="overview"
			/>,
		);

		expect(screen.getByText("Overview body")).toBeInTheDocument();
		expect(screen.queryByText("Day tab day-1")).not.toBeInTheDocument();
	});

	it("closes from the dialog close button", () => {
		const onClose = vi.fn();

		render(
			<RoutineModal
				open
				onClose={onClose}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("resets to the initial tab when the dialog reports reopening", () => {
		render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-day-1"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete this day" }));
		expect(screen.getByText("Overview body")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));

		expect(screen.getByText("Day tab day-1")).toBeInTheDocument();
	});
});
