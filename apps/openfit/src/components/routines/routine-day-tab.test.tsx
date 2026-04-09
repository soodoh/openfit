import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RoutineDay, Units, WorkoutSessionWithData } from "@/lib/types";
import { RoutineDayTab } from "./routine-day-tab";

const mockUnits: Units = {
	repetitionUnits: [{ id: "rep", name: "Reps" }],
	weightUnits: [{ id: "weight", name: "lb" }],
};

const mockRoutineDay: RoutineDay & {
	setGroups: [];
} = {
	id: "day-1",
	routineId: "routine-1",
	userId: "user-1",
	description: "Pull Day",
	createdAt: new Date("2026-03-01T00:00:00.000Z"),
	updatedAt: new Date("2026-03-02T00:00:00.000Z"),
	weekdays: [1, 3],
	setGroups: [],
};

const mockNavigate = vi.fn();
const mockUpdateRoutineDay = vi.fn();
const mockCreateSession = vi.fn();
const mockDeleteRoutineDay = vi.fn();
let mockRoutineDayValue: typeof mockRoutineDay | undefined = mockRoutineDay;
let mockUnitsValue: Units | undefined = mockUnits;

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks", () => ({
	useRoutineDay: () => ({ data: mockRoutineDayValue }),
	useUnits: () => ({ data: mockUnitsValue }),
	useUpdateRoutineDay: () => ({
		mutateAsync: mockUpdateRoutineDay,
	}),
	useCreateSession: () => ({
		mutateAsync: mockCreateSession,
	}),
	useDeleteRoutineDay: () => ({
		mutateAsync: mockDeleteRoutineDay,
	}),
}));

vi.mock("@/components/workoutSet/workout-list", () => ({
	WorkoutList: () => <div data-testid="workout-list">Workout List</div>,
}));

describe("RoutineDayTab", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRoutineDayValue = mockRoutineDay;
		mockUnitsValue = mockUnits;
		mockUpdateRoutineDay.mockResolvedValue({});
		mockCreateSession.mockResolvedValue({ id: "session-1" });
		mockDeleteRoutineDay.mockResolvedValue({});
	});

	it("loads the day details, updates the schedule, and starts a workout", async () => {
		render(
			<RoutineDayTab
				dayId="day-1"
				currentSession={undefined}
				onDeleted={vi.fn()}
			/>,
		);

		expect(screen.getByDisplayValue("Pull Day")).toBeInTheDocument();
		expect(screen.getByTestId("workout-list")).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText("Day Name"), {
			target: { value: "Pull + Biceps" },
		});
		fireEvent.blur(screen.getByLabelText("Day Name"));

		await waitFor(() => {
			expect(mockUpdateRoutineDay).toHaveBeenCalledWith({
				id: "day-1",
				description: "Pull + Biceps",
			});
		});

		fireEvent.click(screen.getByRole("button", { name: "Thursday" }));
		await waitFor(() => {
			expect(mockUpdateRoutineDay).toHaveBeenCalledWith({
				id: "day-1",
				weekdays: [1, 3, 4],
			});
		});

		fireEvent.click(screen.getByRole("button", { name: "Start Workout" }));
		await waitFor(() => {
			expect(mockCreateSession).toHaveBeenCalledWith({ templateId: "day-1" });
		});
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/workout" });
	});

	it("opens the delete modal from the footer action", () => {
		render(
			<RoutineDayTab
				dayId="day-1"
				currentSession={undefined}
				onDeleted={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete Day" }));
		expect(screen.getByRole("dialog")).toHaveTextContent("Delete Workout Day");
	});

	it("shows a loading spinner while the day or units are unavailable", () => {
		mockRoutineDayValue = undefined;
		mockUnitsValue = undefined;

		const { container } = render(
			<RoutineDayTab
				dayId="day-1"
				currentSession={undefined}
				onDeleted={vi.fn()}
			/>,
		);

		expect(container.querySelector("svg.animate-spin")).toBeInTheDocument();
		expect(screen.queryByLabelText("Day Name")).not.toBeInTheDocument();
	});

	it("disables starting a workout when a current session exists", () => {
		render(
			<RoutineDayTab
				dayId="day-1"
				currentSession={{ id: "session-1" } as WorkoutSessionWithData}
				onDeleted={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Start Workout" }),
		).toBeDisabled();
	});
});
