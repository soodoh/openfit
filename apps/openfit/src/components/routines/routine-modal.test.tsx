import { fireEvent, render, screen } from "@testing-library/react";
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
			<button type="button" onClick={() => onSelectDay("day-1")}>
				Overview select day-1
			</button>
			<button type="button" onClick={() => onDayAdded?.("day-2")}>
				Overview add day-2
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

	it("switches to a day tab and returns to overview after day deletion callback", () => {
		render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Day 1: Pull" }));
		expect(screen.getByText("Day tab day-1")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Delete this day" }));
		expect(screen.getByText("Overview body")).toBeInTheDocument();
	});

	it("switches tabs when overview requests opening a specific day", () => {
		render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Overview add day-2" }));
		expect(screen.getByText("Day tab day-2")).toBeInTheDocument();
	});
});
