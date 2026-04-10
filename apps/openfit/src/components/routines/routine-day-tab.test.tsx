import { userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
		const screen = await render(
			<RoutineDayTab
				dayId="day-1"
				currentSession={undefined}
				onDeleted={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByDisplayValue("Pull Day"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("workout-list"))
			.toBeInTheDocument();

		await screen.getByLabelText("Day Name").fill("Pull + Biceps");
		await userEvent.click(screen.getByLabelText("Day Name"));
		screen
			.getByLabelText("Day Name")
			.element()
			.dispatchEvent(new Event("blur", { bubbles: true }));

		await vi.waitFor(() => {
			expect(mockUpdateRoutineDay).toHaveBeenCalledWith({
				id: "day-1",
				description: "Pull + Biceps",
			});
		});

		await userEvent.click(screen.getByRole("button", { name: "Thursday" }));
		await vi.waitFor(() => {
			expect(mockUpdateRoutineDay).toHaveBeenCalledWith({
				id: "day-1",
				weekdays: [1, 3, 4],
			});
		});

		await userEvent.click(
			screen.getByRole("button", { name: "Start Workout" }),
		);
		await vi.waitFor(() => {
			expect(mockCreateSession).toHaveBeenCalledWith({ templateId: "day-1" });
		});
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/workout" });
	});

	it("opens the delete modal from the footer action", async () => {
		const screen = await render(
			<RoutineDayTab
				dayId="day-1"
				currentSession={undefined}
				onDeleted={vi.fn()}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete Day" }));
		await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByRole("dialog").element().textContent).toContain(
			"Delete Workout Day",
		);
	});

	it("shows a loading spinner while the day or units are unavailable", async () => {
		mockRoutineDayValue = undefined;
		mockUnitsValue = undefined;

		const screen = await render(
			<RoutineDayTab
				dayId="day-1"
				currentSession={undefined}
				onDeleted={vi.fn()}
			/>,
		);

		await vi.waitFor(() => {
			expect(
				screen.container.querySelector("svg.animate-spin"),
			).toBeInTheDocument();
		});
		await expect
			.element(screen.getByLabelText("Day Name"))
			.not.toBeInTheDocument();
	});

	it("disables starting a workout when a current session exists", async () => {
		const screen = await render(
			<RoutineDayTab
				dayId="day-1"
				currentSession={{ id: "session-1" } as WorkoutSessionWithData}
				onDeleted={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByRole("button", { name: "Start Workout" }))
			.toBeDisabled();
	});
});
