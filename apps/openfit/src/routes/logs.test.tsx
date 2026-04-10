import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	it("shows a loading skeleton while the session data is pending", async () => {
		mockUseSessionsByDateRange.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		render(<LogsRoute.options.component />);

		await vi.waitFor(() =>
			expect(document.querySelector(".animate-spin")).toBeTruthy(),
		);
	});

	it("renders the empty state when there are no sessions in the current month", async () => {
		const screen = await render(<LogsRoute.options.component />);

		await expect
			.element(screen.getByText("No workout logs yet"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Create session"))
			.toBeInTheDocument();
	});

	it("renders the month summary and calendar when sessions exist", async () => {
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

		const screen = await render(<LogsRoute.options.component />);

		await expect
			.element(screen.getByTestId("resume-session-button"))
			.toHaveTextContent("session-1");
		await expect
			.element(screen.getByText("Create session"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("monthly-calendar"))
			.toBeInTheDocument();
		await expect.element(screen.getByText(/session in/i)).toBeInTheDocument();
	});
});
