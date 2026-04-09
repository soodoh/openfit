import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Units,
	WorkoutSessionSummary,
	WorkoutSessionWithData,
} from "@/lib/types";
import { MonthlyCalendar } from "./monthly-calendar";

dayjs.extend(duration);

const mockCreateSession = vi.fn();
const mockUpdateSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockSessionData: Record<string, WorkoutSessionWithData> = {};

vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children }: { to: string; children: ReactNode }) => (
		<a href={to}>{children}</a>
	),
}));

vi.mock("@/hooks", () => ({
	useSession: (sessionId: string | undefined) => ({
		data: sessionId ? (mockSessionData[sessionId] ?? undefined) : undefined,
	}),
	useCreateSession: () => ({
		mutateAsync: mockCreateSession,
	}),
	useUpdateSession: () => ({
		mutateAsync: mockUpdateSession,
	}),
	useDeleteSession: () => ({
		mutateAsync: mockDeleteSession,
	}),
}));

vi.mock("@/components/workoutSet/workout-list", () => ({
	WorkoutList: () => <div data-testid="session-workout-list" />,
}));

vi.mock("./edit-name-popover", () => ({
	EditNamePopover: () => <div data-testid="edit-name-popover" />,
}));

vi.mock("./edit-duration-popover", () => ({
	EditDurationPopover: () => <div data-testid="edit-duration-popover" />,
}));

vi.mock("./edit-rating-popover", () => ({
	EditRatingPopover: () => <div data-testid="edit-rating-popover" />,
}));

vi.mock("./edit-notes-popover", () => ({
	EditNotesPopover: () => <div data-testid="edit-notes-popover" />,
}));

vi.mock("./delete-session-modal", () => ({
	DeleteSessionModal: () => null,
}));

vi.mock("./select-template", () => ({
	SelectTemplate: () => <div data-testid="select-template" />,
}));

vi.mock("@/components/ui/date-time-picker", () => ({
	DateTimePicker: ({
		label,
		value,
	}: {
		label: string;
		value: Date | undefined;
	}) => (
		<div>
			{`${label} value: ${value ? `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()} ${value.getHours()}` : "none"}`}
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
	beforeEach(() => {
		vi.clearAllMocks();
		Object.keys(mockSessionData).forEach((key) => {
			delete mockSessionData[key];
		});
	});

	it("renders sessions, highlights the current session, and opens real session details via +N more", () => {
		const sessions: WorkoutSessionSummary[] = [
			{
				id: "session-0",
				name: "Long Session",
				startTime: new Date("2026-04-10T07:00:00.000Z"),
				endTime: new Date("2026-04-10T09:30:00.000Z"),
				impression: 3,
				createdAt: new Date("2026-04-10T07:00:00.000Z"),
			},
			buildSession("session-1", "Push A", "2026-04-10T08:00:00.000Z"),
			buildSession("session-2", "Active Session", "2026-04-10T09:00:00.000Z"),
			buildSession("session-3", "Hidden Session", "2026-04-10T10:00:00.000Z"),
			buildSession("session-4", "Upper B", "2026-04-10T11:00:00.000Z"),
		];
		mockSessionData["session-3"] = {
			id: "session-3",
			userId: "user-1",
			name: "Hidden Session",
			notes: "",
			impression: null,
			startTime: new Date("2026-04-10T10:00:00.000Z"),
			endTime: null,
			templateId: null,
			createdAt: new Date("2026-04-10T10:00:00.000Z"),
			updatedAt: new Date("2026-04-10T10:00:00.000Z"),
			setGroups: [],
		};

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
		expect(screen.getByText("2h 30m")).toBeInTheDocument();
		expect(screen.getByText("Active Session").closest("button")).toHaveClass(
			"bg-primary",
		);

		fireEvent.click(screen.getByRole("button", { name: "+2 more" }));

		expect(
			screen.getByRole("heading", { name: "Hidden Session" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Delete Session" }),
		).toBeVisible();
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

	it("opens real create-session modal with the clicked date at 9 AM", () => {
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

		expect(screen.getByRole("heading", { name: "New Session" })).toBeVisible();
		expect(
			screen.getByText("Start Time value: 2026-4-15 9"),
		).toBeInTheDocument();
	});

	it("renders minute-only durations for shorter sessions", () => {
		render(
			<MonthlyCalendar
				currentMonth={dayjs("2026-04-01")}
				sessions={[
					{
						id: "session-5",
						name: "Short Session",
						startTime: new Date("2026-04-15T08:00:00.000Z"),
						endTime: new Date("2026-04-15T08:45:00.000Z"),
						impression: null,
						createdAt: new Date("2026-04-15T08:00:00.000Z"),
					},
				]}
				units={mockUnits}
				onMonthChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Short Session")).toBeInTheDocument();
		expect(screen.getByText("45m")).toBeInTheDocument();
	});

	it("opens the session detail modal when a visible session card is clicked", () => {
		mockSessionData["session-6"] = {
			id: "session-6",
			userId: "user-1",
			name: "Visible Session",
			notes: "",
			impression: null,
			startTime: new Date("2026-04-15T08:00:00.000Z"),
			endTime: new Date("2026-04-15T08:30:00.000Z"),
			templateId: null,
			createdAt: new Date("2026-04-15T08:00:00.000Z"),
			updatedAt: new Date("2026-04-15T08:00:00.000Z"),
			setGroups: [],
		};

		render(
			<MonthlyCalendar
				currentMonth={dayjs("2026-04-01")}
				sessions={[
					{
						id: "session-6",
						name: "Visible Session",
						startTime: new Date("2026-04-15T08:00:00.000Z"),
						endTime: new Date("2026-04-15T08:30:00.000Z"),
						impression: null,
						createdAt: new Date("2026-04-15T08:00:00.000Z"),
					},
				]}
				units={mockUnits}
				onMonthChange={vi.fn()}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Visible Session 30m" }),
		);

		expect(
			screen.getByRole("heading", { name: "Visible Session" }),
		).toBeVisible();
	});
});
