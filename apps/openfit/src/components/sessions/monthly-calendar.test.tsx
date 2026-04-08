import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import type { Units, WorkoutSessionSummary } from "@/lib/types";
import { MonthlyCalendar } from "./monthly-calendar";

vi.mock("./session-detail-modal", () => ({
	SessionDetailModal: ({
		sessionId,
		open,
		isActive,
	}: {
		sessionId: string | undefined;
		open: boolean;
		isActive: boolean;
	}) => (
		<div data-testid="session-detail-modal">
			{open ? `open:${sessionId}:${String(isActive)}` : "closed"}
		</div>
	),
}));

vi.mock("./edit-session-modal", () => ({
	EditSessionModal: ({
		open,
		defaultStartDate,
	}: {
		open: boolean;
		defaultStartDate: Date | undefined;
	}) => (
		<div data-testid="edit-session-modal">
			{open
				? `open:${defaultStartDate?.getDate()}:${defaultStartDate?.getHours()}`
				: "closed"}
		</div>
	),
}));

const mockUnits: Units = {
	repetitionUnits: [],
	weightUnits: [],
};

const buildSession = (
	id: string,
	name: string,
	startTime: string,
): WorkoutSessionSummary => ({
	id,
	name,
	startTime: new Date(startTime),
	endTime: null,
	impression: null,
	createdAt: new Date(startTime),
});

describe("MonthlyCalendar", () => {
	it("renders sessions, highlights the current session, and opens the +N more session", () => {
		const sessions: WorkoutSessionSummary[] = [
			buildSession("session-1", "Push A", "2026-04-10T08:00:00.000Z"),
			buildSession("session-2", "Active Session", "2026-04-10T09:00:00.000Z"),
			buildSession("session-3", "Upper B", "2026-04-10T10:00:00.000Z"),
			buildSession("session-4", "Hidden Session", "2026-04-10T11:00:00.000Z"),
		];

		render(
			<MonthlyCalendar
				currentMonth={dayjs("2026-04-01")}
				sessions={sessions}
				currentSessionId="session-2"
				units={mockUnits}
				onMonthChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Push A")).toBeInTheDocument();
		expect(screen.getByText("Active Session").closest("button")).toHaveClass(
			"bg-primary",
		);

		fireEvent.click(screen.getByRole("button", { name: "+1 more" }));

		expect(screen.getByTestId("session-detail-modal")).toHaveTextContent(
			"open:session-4:false",
		);
	});

	it("calls month navigation callbacks for previous, next, and today", () => {
		const onMonthChange = vi.fn();

		render(
			<MonthlyCalendar
				currentMonth={dayjs("2026-04-01")}
				sessions={[]}
				units={mockUnits}
				onMonthChange={onMonthChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
		fireEvent.click(screen.getByRole("button", { name: "Next month" }));
		fireEvent.click(screen.getByRole("button", { name: "Today" }));

		expect(onMonthChange).toHaveBeenCalledTimes(3);
		expect(onMonthChange.mock.calls[0][0].format("YYYY-MM")).toBe("2026-03");
		expect(onMonthChange.mock.calls[1][0].format("YYYY-MM")).toBe("2026-05");
		expect(onMonthChange.mock.calls[2][0].isSame(dayjs(), "day")).toBe(true);
	});

	it("opens create session modal with the clicked date at 9 AM", () => {
		render(
			<MonthlyCalendar
				currentMonth={dayjs("2026-04-01")}
				sessions={[]}
				units={mockUnits}
				onMonthChange={vi.fn()}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Create session on April 15, 2026",
			}),
		);

		expect(screen.getByTestId("edit-session-modal")).toHaveTextContent(
			"open:15:9",
		);
	});
});
