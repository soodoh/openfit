import { userEvent } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { RoutineWithDays, WorkoutSessionWithData } from "@/lib/types";
import { RoutineOverviewTab } from "./routine-overview-tab";

const mockNavigate = vi.fn();
const mockCreateSession = vi.fn();
const mockCreateRoutine = vi.fn();
const mockUpdateRoutine = vi.fn();
const mockCreateRoutineDay = vi.fn();
const mockUpdateRoutineDay = vi.fn();
const mockDeleteRoutine = vi.fn();
const mockDeleteRoutineDay = vi.fn();

// Pin system time just after the routine's updatedAt so fromNow() returns "a few seconds ago"
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-03-02T00:00:01.000Z"));
});
afterEach(() => {
	vi.useRealTimers();
});

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks", () => ({
	useCreateSession: () => ({
		mutateAsync: mockCreateSession,
	}),
	useCreateRoutine: () => ({
		mutateAsync: mockCreateRoutine,
	}),
	useUpdateRoutine: () => ({
		mutateAsync: mockUpdateRoutine,
	}),
	useCreateRoutineDay: () => ({
		mutateAsync: mockCreateRoutineDay,
	}),
	useUpdateRoutineDay: () => ({
		mutateAsync: mockUpdateRoutineDay,
	}),
	useDeleteRoutine: () => ({
		mutateAsync: mockDeleteRoutine,
	}),
	useDeleteRoutineDay: () => ({
		mutateAsync: mockDeleteRoutineDay,
	}),
}));

vi.mock("./edit-routine-modal", () => ({
	EditRoutineModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div role="dialog">
				<div>Edit Routine Modal</div>
				<button type="button" onClick={onClose}>
					Close modal
				</button>
			</div>
		) : null,
}));

vi.mock("./edit-day-modal", () => ({
	EditDayModal: ({
		open,
		onClose,
		onSuccess,
	}: {
		open: boolean;
		onClose: () => void;
		onSuccess?: (dayId: string) => void;
	}) =>
		open ? (
			<div role="dialog">
				<div>Add Day Modal</div>
				<button type="button" onClick={() => onSuccess?.("day-3")}>
					Confirm Add Day
				</button>
				<button type="button" onClick={onClose}>
					Close modal
				</button>
			</div>
		) : null,
}));

vi.mock("./delete-routine-modal", () => ({
	DeleteRoutineModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div role="dialog">
				<div>Delete Routine Modal</div>
				<button type="button" onClick={onClose}>
					Close modal
				</button>
			</div>
		) : null,
}));

vi.mock("./delete-day-modal", () => ({
	DeleteDayModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div role="dialog">
				<div>Delete Day Modal</div>
				<button type="button" onClick={onClose}>
					Close modal
				</button>
			</div>
		) : null,
}));

const buildRoutine = (
	days: RoutineWithDays["routineDays"],
): RoutineWithDays => ({
	id: "routine-1",
	userId: "user-1",
	name: "Strength Plan",
	description: "Four week block",
	createdAt: new Date("2026-03-01T00:00:00.000Z"),
	updatedAt: new Date("2026-03-02T00:00:00.000Z"),
	routineDays: days,
});

describe("RoutineOverviewTab", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateSession.mockResolvedValue({ id: "session-1" });
		mockCreateRoutine.mockResolvedValue({});
		mockUpdateRoutine.mockResolvedValue({});
		mockCreateRoutineDay.mockResolvedValue({ id: "day-3" });
		mockUpdateRoutineDay.mockResolvedValue({});
		mockDeleteRoutine.mockResolvedValue({});
		mockDeleteRoutineDay.mockResolvedValue({});
	});

	it("opens the routine-level modals from the footer actions", async () => {
		const screen = await render(
			<RoutineOverviewTab
				routine={buildRoutine([])}
				currentSession={undefined}
				onSelectDay={vi.fn()}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Edit" }));
		await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByRole("dialog").element().textContent).toContain(
			"Edit Routine Modal",
		);
		await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
		await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Delete Routine" }),
		);
		await expect
			.element(screen.getByText("Delete Routine Modal"))
			.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
		await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("starts a day workout, selects a day, and opens the day delete modal", async () => {
		const onSelectDay = vi.fn();
		const routine = buildRoutine([
			{
				id: "day-1",
				routineId: "routine-1",
				userId: "user-1",
				description: "Pull Day",
				createdAt: new Date("2026-03-01T00:00:00.000Z"),
				updatedAt: new Date("2026-03-01T00:00:00.000Z"),
				weekdays: [1, 3],
			},
		]);

		const screen = await render(
			<RoutineOverviewTab
				routine={routine}
				currentSession={undefined}
				onSelectDay={onSelectDay}
			/>,
		);

		await userEvent.click(
			screen.getByText("Pull Day").closest("button") as HTMLButtonElement,
		);
		expect(onSelectDay).toHaveBeenCalledWith("day-1");

		await userEvent.click(screen.getByRole("button", { name: "Start" }));
		await vi.waitFor(() => {
			expect(mockCreateSession).toHaveBeenCalledWith({ templateId: "day-1" });
		});
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/workout" });

		await userEvent.click(
			screen.getByRole("button", { name: "Delete workout day Pull Day" }),
		);
		await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByRole("dialog").element().textContent).toContain(
			"Delete Day Modal",
		);
		await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
		await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("does not navigate when starting a workout does not return a session id", async () => {
		mockCreateSession.mockResolvedValueOnce(null);

		const routine = buildRoutine([
			{
				id: "day-1",
				routineId: "routine-1",
				userId: "user-1",
				description: "Pull Day",
				createdAt: new Date("2026-03-01T00:00:00.000Z"),
				updatedAt: new Date("2026-03-01T00:00:00.000Z"),
				weekdays: [],
			},
		]);

		const screen = await render(
			<RoutineOverviewTab
				routine={routine}
				currentSession={undefined}
				onSelectDay={vi.fn()}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Start" }));

		await vi.waitFor(() => {
			expect(mockCreateSession).toHaveBeenCalledWith({ templateId: "day-1" });
		});
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("opens the add-day modal from the empty state", async () => {
		const screen = await render(
			<RoutineOverviewTab
				routine={buildRoutine([])}
				currentSession={undefined}
				onSelectDay={vi.fn()}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Add Workout Day" }),
		);
		await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByRole("dialog").element().textContent).toContain(
			"Add Day Modal",
		);
	});

	it("opens the add-day modal from the footer when the routine already has days", async () => {
		const routine = buildRoutine([
			{
				id: "day-1",
				routineId: "routine-1",
				userId: "user-1",
				description: "Pull Day",
				createdAt: new Date("2026-03-01T00:00:00.000Z"),
				updatedAt: new Date("2026-03-01T00:00:00.000Z"),
				weekdays: [1, 3],
			},
		]);

		const screen = await render(
			<RoutineOverviewTab
				routine={routine}
				currentSession={undefined}
				onSelectDay={vi.fn()}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Add Day" }));
		await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByRole("dialog").element().textContent).toContain(
			"Add Day Modal",
		);
		await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
		await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("propagates the added day id from the modal", async () => {
		const onDayAdded = vi.fn();

		const screen = await render(
			<RoutineOverviewTab
				routine={buildRoutine([])}
				currentSession={undefined}
				onSelectDay={vi.fn()}
				onDayAdded={onDayAdded}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Add Workout Day" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Confirm Add Day" }),
		);

		expect(onDayAdded).toHaveBeenCalledWith("day-3");
	});

	it("disables the day start action while a session is already active", async () => {
		const routine = buildRoutine([
			{
				id: "day-1",
				routineId: "routine-1",
				userId: "user-1",
				description: "Pull Day",
				createdAt: new Date("2026-03-01T00:00:00.000Z"),
				updatedAt: new Date("2026-03-01T00:00:00.000Z"),
				weekdays: [],
			},
		]);

		const screen = await render(
			<RoutineOverviewTab
				routine={routine}
				currentSession={{ id: "session-1" } as WorkoutSessionWithData}
				onSelectDay={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByRole("button", { name: "Start" }))
			.toBeDisabled();
	});
});
