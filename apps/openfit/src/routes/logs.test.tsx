import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LogsRoute from "./logs";

const mockUseCurrentSession = vi.fn();
const mockUseSessionsByDateRange = vi.fn();
const mockUseUnits = vi.fn();

vi.mock("@/components/sessions/create-session", () => ({
	CreateSessionButton: () => <button type="button">Create session</button>,
}));

vi.mock("@/components/sessions/monthly-calendar", () => ({
	MonthlyCalendar: ({
		currentMonth,
		sessions,
	}: {
		currentMonth: { format: (pattern: string) => string };
		sessions: Array<{ id: string }>;
	}) => (
		<div data-testid="monthly-calendar">
			{currentMonth.format("MMMM YYYY")} - {sessions.length}
		</div>
	),
}));

vi.mock("@/components/sessions/resume-session-button", () => ({
	ResumeSessionButton: ({ session }: { session: { id: string } }) => (
		<div data-testid="resume-session-button">{session.id}</div>
	),
}));

vi.mock("@/hooks", () => ({
	useCurrentSession: () => mockUseCurrentSession(),
	useSessionsByDateRange: (...args: unknown[]) =>
		mockUseSessionsByDateRange(...args),
	useUnits: () => mockUseUnits(),
}));

describe("logs route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseCurrentSession.mockReturnValue({ data: undefined });
		mockUseSessionsByDateRange.mockReturnValue({ data: [], isLoading: false });
		mockUseUnits.mockReturnValue({
			data: { repetitionUnits: [], weightUnits: [] },
			isLoading: false,
		});
	});

	it("shows a loading skeleton while the session data is pending", () => {
		mockUseSessionsByDateRange.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		render(<LogsRoute.options.component />);

		expect(document.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("renders the empty state when there are no sessions in the current month", () => {
		render(<LogsRoute.options.component />);

		expect(screen.getByText("No workout logs yet")).toBeInTheDocument();
		expect(screen.getByText("Create session")).toBeInTheDocument();
	});

	it("renders the month summary and calendar when sessions exist", () => {
		const currentSession = { id: "session-1" };
		const sessions = [
			{
				id: "session-1",
				startTime: new Date().toISOString(),
			},
		];

		mockUseCurrentSession.mockReturnValue({ data: currentSession });
		mockUseSessionsByDateRange.mockReturnValue({
			data: sessions,
			isLoading: false,
		});

		render(<LogsRoute.options.component />);

		expect(screen.getByTestId("resume-session-button")).toHaveTextContent(
			"session-1",
		);
		expect(screen.getByText("Create session")).toBeInTheDocument();
		expect(screen.getByTestId("monthly-calendar")).toBeInTheDocument();
		expect(screen.getByText(/session in/i)).toBeInTheDocument();
	});
});
