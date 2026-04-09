import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RoutineDay } from "@/lib/types";
import { EditDayModal } from "./edit-day-modal";

const mockCreateRoutineDay = vi.fn();
const mockUpdateRoutineDay = vi.fn();

vi.mock("./weekday-selector", () => ({
	WeekdaySelector: ({
		selectedWeekdays,
		onChange,
	}: {
		selectedWeekdays: number[];
		onChange: (weekdays: number[]) => void;
	}) => (
		<div>
			<div>{`Selected ${selectedWeekdays.join(",")}`}</div>
			<button type="button" onClick={() => onChange([1, 3])}>
				Set weekdays
			</button>
		</div>
	),
}));

vi.mock("@/hooks", () => ({
	useCreateRoutineDay: () => ({
		mutateAsync: mockCreateRoutineDay,
	}),
	useUpdateRoutineDay: () => ({
		mutateAsync: mockUpdateRoutineDay,
	}),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
		children: ReactNode;
	}) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
}));

describe("EditDayModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateRoutineDay.mockResolvedValue({ id: "day-2" });
		mockUpdateRoutineDay.mockResolvedValue({});
	});

	it("creates a day with the selected weekdays and resets after success", async () => {
		const onClose = vi.fn();
		const onSuccess = vi.fn();

		render(
			<EditDayModal
				open
				onClose={onClose}
				routineId="routine-1"
				onSuccess={onSuccess}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Day Name"), {
			target: { value: "Pull Day" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Set weekdays" }));
		fireEvent.click(screen.getByRole("button", { name: "Add Day" }));

		await waitFor(() => {
			expect(mockCreateRoutineDay).toHaveBeenCalledWith({
				routineId: "routine-1",
				description: "Pull Day",
				weekdays: [1, 3],
			});
			expect(onSuccess).toHaveBeenCalledWith("day-2");
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("updates an existing day and shows the save label", async () => {
		const onClose = vi.fn();
		const routineDay = {
			id: "day-1",
			routineId: "routine-1",
			userId: "user-1",
			description: "Push Day",
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-01T00:00:00.000Z"),
			weekdays: [2, 4],
		} as RoutineDay;

		render(
			<EditDayModal
				open
				onClose={onClose}
				routineId="routine-1"
				routineDay={routineDay}
			/>,
		);

		expect(screen.getByText("Save Changes")).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Day Name"), {
			target: { value: "Push + Shoulders" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await waitFor(() => {
			expect(mockUpdateRoutineDay).toHaveBeenCalledWith({
				id: "day-1",
				description: "Push + Shoulders",
				weekdays: [2, 4],
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});
});
