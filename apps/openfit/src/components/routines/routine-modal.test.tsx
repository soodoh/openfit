import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RoutineWithDays } from "@/lib/types";
import { RoutineModal } from "./routine-modal";

vi.mock("./routine-overview-tab", () => ({
	RoutineOverviewTab: () => <div>Overview body</div>,
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
});
