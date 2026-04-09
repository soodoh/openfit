import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RoutineWithDays } from "@/lib/types";
import { RoutineOverviewTab } from "./routine-overview-tab";

const mockNavigate = vi.fn();
const mockCreateSession = vi.fn();
const mockCreateRoutine = vi.fn();
const mockUpdateRoutine = vi.fn();
const mockCreateRoutineDay = vi.fn();
const mockUpdateRoutineDay = vi.fn();
const mockDeleteRoutine = vi.fn();
const mockDeleteRoutineDay = vi.fn();

vi.mock("dayjs", () => {
	const dayjsMock = (value?: Date | string) => ({
		fromNow: () => "just now",
		day: (weekday: number) => ({
			format: () => {
				const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
				return labels[weekday] ?? String(value ?? "");
			},
		}),
	});

	dayjsMock.extend = vi.fn();
	return { default: dayjsMock };
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
	EditRoutineModal: ({ open }: { open: boolean }) =>
		open ? <div role="dialog">Edit Routine Modal</div> : null,
}));

vi.mock("./edit-day-modal", () => ({
	EditDayModal: ({ open }: { open: boolean }) =>
		open ? <div role="dialog">Add Day Modal</div> : null,
}));

vi.mock("./delete-routine-modal", () => ({
	DeleteRoutineModal: ({ open }: { open: boolean }) =>
		open ? <div role="dialog">Delete Routine Modal</div> : null,
}));

vi.mock("./delete-day-modal", () => ({
	DeleteDayModal: ({ open }: { open: boolean }) =>
		open ? <div role="dialog">Delete Day Modal</div> : null,
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

	it("opens the routine-level modals from the footer actions", () => {
		render(
			<RoutineOverviewTab
				routine={buildRoutine([])}
				currentSession={undefined}
				onSelectDay={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByRole("dialog")).toHaveTextContent("Edit Routine Modal");

		fireEvent.click(screen.getByRole("button", { name: "Delete Routine" }));
		expect(screen.getByText("Delete Routine Modal")).toBeInTheDocument();
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

		render(
			<RoutineOverviewTab
				routine={routine}
				currentSession={undefined}
				onSelectDay={onSelectDay}
			/>,
		);

		fireEvent.click(
			screen.getByText("Pull Day").closest("button") as HTMLButtonElement,
		);
		expect(onSelectDay).toHaveBeenCalledWith("day-1");

		fireEvent.click(screen.getByRole("button", { name: "Start" }));
		await waitFor(() => {
			expect(mockCreateSession).toHaveBeenCalledWith({ templateId: "day-1" });
		});
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/workout" });

		fireEvent.click(
			screen.getByRole("button", { name: "Delete workout day Pull Day" }),
		);
		expect(screen.getByRole("dialog")).toHaveTextContent("Delete Day Modal");
	});

	it("opens the add-day modal from the empty state", () => {
		render(
			<RoutineOverviewTab
				routine={buildRoutine([])}
				currentSession={undefined}
				onSelectDay={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Add Workout Day" }));
		expect(screen.getByRole("dialog")).toHaveTextContent("Add Day Modal");
	});
});
