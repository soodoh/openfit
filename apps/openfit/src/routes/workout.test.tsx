import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutRoute from "./workout";

const mockNavigate = vi.fn();
const mockUseCurrentSession = vi.fn();
const mockUseUnits = vi.fn();

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
		"@tanstack/react-router",
	);

	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/components/sessions/current-session-page", () => ({
	CurrentSessionPage: ({ session }: { session: { id: string } }) => (
		<div data-testid="current-session-page">{session.id}</div>
	),
}));

vi.mock("@/components/sessions/edit-session-modal", () => ({
	EditSessionModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div data-testid="edit-session-modal">
				modal open
				<button type="button" onClick={onClose}>
					Close modal
				</button>
			</div>
		) : null,
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		...props
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		[key: string]: unknown;
	}) => (
		<button type="button" onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

vi.mock("@/hooks", () => ({
	useCurrentSession: () => mockUseCurrentSession(),
	useUnits: () => mockUseUnits(),
}));

describe("workout route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseCurrentSession.mockReturnValue({
			data: undefined,
			isLoading: false,
		});
		mockUseUnits.mockReturnValue({
			data: { repetitionUnits: [], weightUnits: [] },
			isLoading: false,
		});
	});

	it("shows a loading message while session data is pending", () => {
		mockUseCurrentSession.mockReturnValue({ data: undefined, isLoading: true });

		render(<WorkoutRoute.options.component />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("shows a loading message while units are pending", () => {
		mockUseUnits.mockReturnValue({ data: undefined, isLoading: true });

		render(<WorkoutRoute.options.component />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("shows the empty workout state and opens the new-session modal", async () => {
		render(<WorkoutRoute.options.component />);

		expect(screen.getByText("No Active Workout")).toBeInTheDocument();
		expect(screen.getByText("Start New Workout")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Start New Workout" }));

		expect(screen.getByTestId("edit-session-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Back to Dashboard" }));

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
		});
	});

	it("closes the new-session modal when it requests to close", () => {
		render(<WorkoutRoute.options.component />);

		fireEvent.click(screen.getByRole("button", { name: "Start New Workout" }));
		expect(screen.getByTestId("edit-session-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Close modal" }));

		expect(screen.queryByTestId("edit-session-modal")).not.toBeInTheDocument();
	});

	it("renders the current session page when a workout is active", () => {
		mockUseCurrentSession.mockReturnValue({
			data: { id: "session-1" },
			isLoading: false,
		});

		render(<WorkoutRoute.options.component />);

		expect(screen.getByTestId("current-session-page")).toHaveTextContent(
			"session-1",
		);
	});
});
