import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import HomeRoute from "./index";

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();
const mockUseCurrentSession = vi.fn();
const mockUseDashboardStats = vi.fn();
const mockUseRecentSessions = vi.fn();
const mockUseUnits = vi.fn();

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
		"@tanstack/react-router",
	);

	return {
		...actual,
		Link: ({
			children,
			to,
			...props
		}: {
			children: ReactNode;
			to: string;
			[key: string]: unknown;
		}) => (
			<a href={to} {...props}>
				{children}
			</a>
		),
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/components/providers/auth-provider", () => ({
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/sessions/create-session", () => ({
	CreateSessionButton: () => <button type="button">Create session</button>,
}));

vi.mock("@/components/sessions/resume-session-button", () => ({
	ResumeSessionButton: ({ session }: { session: { id: string } }) => (
		<div data-testid="resume-session-button">{session.id}</div>
	),
}));

vi.mock("@/components/sessions/session-detail-modal", () => ({
	SessionDetailModal: ({
		sessionId,
		open,
	}: {
		sessionId: string | undefined;
		open: boolean;
	}) =>
		open ? (
			<div data-testid="session-detail-modal">{sessionId ?? "empty"}</div>
		) : null,
}));

vi.mock("@/components/sessions/session-summary-card", () => ({
	SessionSummaryCard: ({
		session,
		onClick,
	}: {
		session: { id: string; name?: string };
		onClick: () => void;
	}) => (
		<button type="button" onClick={onClick}>
			{session.name ?? session.id}
		</button>
	),
}));

vi.mock("@/hooks", () => ({
	useCurrentSession: () => mockUseCurrentSession(),
	useDashboardStats: () => mockUseDashboardStats(),
	useRecentSessions: () => mockUseRecentSessions(),
	useUnits: () => mockUseUnits(),
}));

describe("home route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
		mockUseCurrentSession.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
		mockUseDashboardStats.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
		mockUseRecentSessions.mockReturnValue({ data: [], isLoading: false });
		mockUseUnits.mockReturnValue({ data: undefined, isLoading: false });
	});

	it("shows a loader while auth is still pending", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

		await render(<HomeRoute.options.component />);

		expect(document.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("redirects anonymous users to sign in", async () => {
		const screen = await render(<HomeRoute.options.component />);

		await vi.waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/signin" });
		});
		await expect
			.element(screen.getByText("Welcome back"))
			.not.toBeInTheDocument();
	});

	it("renders the empty recent activity state when there are no sessions", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		mockUseDashboardStats.mockReturnValue({
			data: {
				totalSessions: 12,
				thisWeekSessions: 3,
				currentStreak: 5,
				totalRoutines: 4,
			},
			isLoading: false,
		});
		mockUseRecentSessions.mockReturnValue({ data: [], isLoading: false });
		mockUseCurrentSession.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
		mockUseUnits.mockReturnValue({
			data: { repetitionUnits: [], weightUnits: [] },
			isLoading: false,
		});

		const screen = await render(<HomeRoute.options.component />);

		await expect.element(screen.getByText("Welcome back")).toBeInTheDocument();
		await expect
			.element(screen.getByText("No workouts yet"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("link", { name: "View all" }))
			.not.toBeInTheDocument();
	});

	it("renders the recent activity skeleton while session data is loading", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		mockUseDashboardStats.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		mockUseRecentSessions.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		mockUseCurrentSession.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
		mockUseUnits.mockReturnValue({
			data: { repetitionUnits: [], weightUnits: [] },
			isLoading: false,
		});

		await render(<HomeRoute.options.component />);

		expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
			0,
		);
	});

	it("renders dashboard cards and opens session details for a recent session", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		mockUseCurrentSession.mockReturnValue({
			data: { id: "current-session-1" },
			isLoading: false,
		});
		mockUseDashboardStats.mockReturnValue({
			data: {
				totalSessions: 12,
				thisWeekSessions: 3,
				currentStreak: 5,
				totalRoutines: 4,
			},
			isLoading: false,
		});
		mockUseRecentSessions.mockReturnValue({
			data: [{ id: "recent-session-1", name: "Leg Day" }],
			isLoading: false,
		});
		mockUseUnits.mockReturnValue({
			data: { repetitionUnits: [], weightUnits: [] },
			isLoading: false,
		});

		const screen = await render(<HomeRoute.options.component />);

		await expect
			.element(screen.getByTestId("resume-session-button"))
			.toHaveTextContent("current-session-1");
		await expect.element(screen.getByText("Leg Day")).toBeInTheDocument();
		await expect
			.element(screen.getByRole("link", { name: "View all" }))
			.toHaveAttribute("href", "/logs");

		await userEvent.click(screen.getByRole("button", { name: "Leg Day" }));

		await expect
			.element(screen.getByTestId("session-detail-modal"))
			.toHaveTextContent("recent-session-1");
	});
});
