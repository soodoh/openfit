import { userEvent } from "@vitest/browser/context";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { Units, WorkoutSessionWithData } from "@/lib/types";
import { SessionDetailModal } from "./session-detail-modal";

dayjs.extend(duration);

const mockUseSession = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

vi.mock("@/hooks", () => ({
	useSession: (sessionId: string | undefined) => mockUseSession(sessionId),
}));

vi.mock("@/components/workoutSet/workout-list", () => ({
	WorkoutList: ({
		view,
		sessionOrDayId,
		setGroups,
	}: {
		view: string;
		sessionOrDayId: string;
		setGroups: Array<{ sets: unknown[] }>;
	}) => (
		<div data-testid="workout-list">
			{view}:{sessionOrDayId}:{setGroups.length}
		</div>
	),
}));

vi.mock("./delete-session-modal", () => ({
	DeleteSessionModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div data-testid="delete-session-modal">
				<button type="button" onClick={onClose}>
					Confirm delete
				</button>
			</div>
		) : null,
}));

vi.mock("./edit-name-popover", () => ({
	EditNamePopover: () => <div data-testid="edit-name-popover" />,
}));
vi.mock("./edit-duration-popover", () => ({
	EditDurationPopover: ({
		formattedDuration,
	}: {
		formattedDuration?: string;
	}) => (
		<div data-testid="edit-duration-popover">{formattedDuration ?? "—"}</div>
	),
}));
vi.mock("./edit-rating-popover", () => ({
	EditRatingPopover: () => <div data-testid="edit-rating-popover" />,
}));
vi.mock("./edit-notes-popover", () => ({
	EditNotesPopover: () => <div data-testid="edit-notes-popover" />,
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({
		open,
		onOpenChange,
		children,
	}: {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		children: ReactNode;
	}) =>
		open ? (
			<div>
				{children}
				<button type="button" onClick={() => onOpenChange?.(false)}>
					Close dialog
				</button>
			</div>
		) : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<p>{children}</p>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: {
		children: ReactNode;
		[key: string]: unknown;
	}) => <button {...props}>{children}</button>,
}));

const mockUnits: Units = {
	repetitionUnits: [],
	weightUnits: [],
};

const session: WorkoutSessionWithData = {
	id: "session-1",
	userId: "user-1",
	name: "Leg Day",
	notes: "Keep bracing",
	impression: 4,
	startTime: new Date("2026-04-01T10:00:00.000Z"),
	endTime: new Date("2026-04-01T11:15:00.000Z"),
	templateId: null,
	createdAt: new Date("2026-04-01T10:00:00.000Z"),
	updatedAt: new Date("2026-04-01T10:00:00.000Z"),
	setGroups: [
		{
			id: "group-1",
			userId: "user-1",
			routineDayId: null,
			sessionId: "session-1",
			type: "NORMAL",
			order: 0,
			comment: null,
			sets: [
				{
					id: "set-1",
					userId: "user-1",
					setGroupId: "group-1",
					exerciseId: "exercise-1",
					type: "NORMAL",
					order: 0,
					reps: 8,
					repetitionUnitId: "rep",
					weight: 135,
					weightUnitId: "weight",
					restTime: 90,
					completed: true,
					exercise: { id: "exercise-1", name: "Bench", imageUrl: null },
					repetitionUnit: { id: "rep", name: "Reps" },
					weightUnit: { id: "weight", name: "lb" },
				},
			],
		},
		{
			id: "group-2",
			userId: "user-1",
			routineDayId: null,
			sessionId: "session-1",
			type: "NORMAL",
			order: 1,
			comment: null,
			sets: [
				{
					id: "set-2",
					userId: "user-1",
					setGroupId: "group-2",
					exerciseId: "exercise-2",
					type: "NORMAL",
					order: 0,
					reps: 10,
					repetitionUnitId: "rep",
					weight: 95,
					weightUnitId: "weight",
					restTime: 60,
					completed: false,
					exercise: { id: "exercise-2", name: "Squat", imageUrl: null },
					repetitionUnit: { id: "rep", name: "Reps" },
					weightUnit: { id: "weight", name: "lb" },
				},
			],
		},
	],
};

describe("SessionDetailModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseSession.mockReturnValue({ data: undefined });
	});

	it("shows the loading state until the full session is available", async () => {
		const screen = await render(
			<SessionDetailModal
				sessionId="session-1"
				units={mockUnits}
				open
				onClose={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByText("Loading session..."))
			.toBeInTheDocument();
	});

	it("shows the loading state when no session id is available", async () => {
		const screen = await render(
			<SessionDetailModal
				sessionId={undefined}
				units={mockUnits}
				open
				onClose={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByText("Loading session..."))
			.toBeInTheDocument();
	});

	it("renders the active session details and confirms delete through the nested modal", async () => {
		const onClose = vi.fn();
		mockUseSession.mockReturnValue({ data: session });

		const screen = await render(
			<SessionDetailModal
				sessionId="session-1"
				units={mockUnits}
				open
				onClose={onClose}
				isActive
			/>,
		);

		await expect
			.element(screen.getByRole("heading", { name: "Leg Day" }))
			.toBeInTheDocument();
		await expect.element(screen.getByText("In Progress")).toBeInTheDocument();
		await expect
			.element(screen.getByText("2 exercises • 2 sets"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("link", { name: "Continue Workout" }))
			.toHaveAttribute("href", "/workout");
		await expect
			.element(screen.getByTestId("workout-list"))
			.toHaveTextContent("CurrentSession:session-1:2");

		await userEvent.click(
			screen.getByRole("button", { name: "Delete Session" }),
		);
		await expect
			.element(screen.getByTestId("delete-session-modal"))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Confirm delete" }),
		);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("renders an inactive session without the continue workout action", async () => {
		mockUseSession.mockReturnValue({ data: session });

		const screen = await render(
			<SessionDetailModal
				sessionId="session-1"
				units={mockUnits}
				open
				onClose={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByText("In Progress"))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByRole("link", { name: "Continue Workout" }))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("workout-list"))
			.toHaveTextContent("ViewSession:session-1:2");
	});

	it("closes the dialog when the dialog control requests it", async () => {
		const onClose = vi.fn();
		mockUseSession.mockReturnValue({ data: session });

		const screen = await render(
			<SessionDetailModal
				sessionId="session-1"
				units={mockUnits}
				open
				onClose={onClose}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("formats short sessions and singular workout stats", async () => {
		mockUseSession.mockReturnValue({
			data: {
				...session,
				startTime: new Date("2026-04-01T10:00:00.000Z"),
				endTime: new Date("2026-04-01T10:45:00.000Z"),
				setGroups: [
					{
						...session.setGroups[0],
						sets: [session.setGroups[0].sets[0]],
					},
				],
			},
		});

		const screen = await render(
			<SessionDetailModal
				sessionId="session-1"
				units={mockUnits}
				open
				onClose={vi.fn()}
			/>,
		);

		await expect.element(screen.getByText("45 min")).toBeInTheDocument();
		await expect
			.element(screen.getByText("1 exercise • 1 set"))
			.toBeInTheDocument();
	});

	it("formats sessions without an end time as having no duration", async () => {
		mockUseSession.mockReturnValue({
			data: {
				...session,
				endTime: null,
			},
		});

		const screen = await render(
			<SessionDetailModal
				sessionId="session-1"
				units={mockUnits}
				open
				onClose={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByRole("heading", { name: "Leg Day" }))
			.toBeInTheDocument();
	});
});
