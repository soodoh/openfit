import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
	it("falls back to overview when initialTab is invalid", async () => {
		const screen = await render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-does-not-exist"
			/>,
		);

		await expect.element(screen.getByText("Overview body")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Day tab day-1"))
			.not.toBeInTheDocument();
	});

	it("renders the requested day tab when initialTab matches a routine day", async () => {
		const screen = await render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-day-2"
			/>,
		);

		await expect.element(screen.getByText("Day tab day-2")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Overview body"))
			.not.toBeInTheDocument();
	});

	it("truncates long routine day names in the tab list", async () => {
		const routine = {
			...mockRoutine,
			routineDays: [
				{
					...mockRoutine.routineDays[0],
					description: "An extremely long workout day name",
				},
			],
		};

		const screen = await render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={routine}
				currentSession={undefined}
			/>,
		);

		await expect
			.element(screen.getByRole("tab", { name: "Day 1: An extremely lo..." }))
			.toBeInTheDocument();
	});

	it("returns to overview when day-tab deletion callback fires", async () => {
		const screen = await render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-day-1"
			/>,
		);

		await expect.element(screen.getByText("Day tab day-1")).toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: "Delete this day" }),
		);
		await expect.element(screen.getByText("Overview body")).toBeInTheDocument();
	});

	it("switches to a selected day from the overview tab", async () => {
		const screen = await render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Select day 2" }));
		await expect.element(screen.getByText("Day tab day-2")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Overview body"))
			.not.toBeInTheDocument();
	});

	it("switches to a newly added day from the overview tab", async () => {
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

		const screen = await render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);

		await screen.rerender(
			<RoutineModal
				open={false}
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);
		await screen.rerender(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="overview"
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Add day 3" }));
		await screen.rerender(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={updatedRoutine}
				currentSession={undefined}
				initialTab="overview"
			/>,
		);
		await expect.element(screen.getByText("Day tab day-3")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Overview body"))
			.not.toBeInTheDocument();
	});

	it("resets to the initial tab when the modal is reopened", async () => {
		const screen = await render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-day-1"
			/>,
		);

		await expect.element(screen.getByText("Day tab day-1")).toBeInTheDocument();

		await screen.rerender(
			<RoutineModal
				open={false}
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="overview"
			/>,
		);
		await screen.rerender(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="overview"
			/>,
		);

		await expect.element(screen.getByText("Overview body")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Day tab day-1"))
			.not.toBeInTheDocument();
	});

	it("closes from the dialog close button", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<RoutineModal
				open
				onClose={onClose}
				routine={mockRoutine}
				currentSession={undefined}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("resets to the initial tab when the dialog reports reopening", async () => {
		const screen = await render(
			<RoutineModal
				open
				onClose={vi.fn()}
				routine={mockRoutine}
				currentSession={undefined}
				initialTab="day-day-1"
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Delete this day" }),
		);
		await expect.element(screen.getByText("Overview body")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));

		await expect.element(screen.getByText("Day tab day-1")).toBeInTheDocument();
	});
});
