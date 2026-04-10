import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

		const screen = await render(
			<EditDayModal
				open
				onClose={onClose}
				routineId="routine-1"
				onSuccess={onSuccess}
			/>,
		);

		await screen.getByLabelText("Day Name").fill("Pull Day");
		await userEvent.click(screen.getByRole("button", { name: "Set weekdays" }));
		await userEvent.click(screen.getByRole("button", { name: "Add Day" }));

		await vi.waitFor(() => {
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

		const screen = await render(
			<EditDayModal
				open
				onClose={onClose}
				routineId="routine-1"
				routineDay={routineDay}
			/>,
		);

		await expect.element(screen.getByText("Save Changes")).toBeInTheDocument();
		await screen.getByLabelText("Day Name").fill("Push + Shoulders");
		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await vi.waitFor(() => {
			expect(mockUpdateRoutineDay).toHaveBeenCalledWith({
				id: "day-1",
				description: "Push + Shoulders",
				weekdays: [2, 4],
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("resets the form when reopened for the same day", async () => {
		const routineDay = {
			id: "day-1",
			routineId: "routine-1",
			userId: "user-1",
			description: "Push Day",
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-01T00:00:00.000Z"),
			weekdays: [2, 4],
		} as RoutineDay;

		const screen = await render(
			<EditDayModal
				open
				onClose={vi.fn()}
				routineId="routine-1"
				routineDay={routineDay}
			/>,
		);

		await screen.getByLabelText("Day Name").fill("Changed name");
		await userEvent.click(screen.getByRole("button", { name: "Set weekdays" }));

		await screen.rerender(
			<EditDayModal
				open={false}
				onClose={vi.fn()}
				routineId="routine-1"
				routineDay={routineDay}
			/>,
		);
		await screen.rerender(
			<EditDayModal
				open
				onClose={vi.fn()}
				routineId="routine-1"
				routineDay={routineDay}
			/>,
		);

		await vi.waitFor(() => {
			expect(screen.getByLabelText("Day Name").element()).toHaveValue(
				"Push Day",
			);
		});
		await expect.element(screen.getByText("Selected 2,4")).toBeInTheDocument();
	});

	it("closes from the dialog close button", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<EditDayModal open onClose={onClose} routineId="routine-1" />,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Close", exact: true }),
		);

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
