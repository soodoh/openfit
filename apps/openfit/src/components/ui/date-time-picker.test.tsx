import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DateTimePicker } from "./date-time-picker";

const mockCalendar = vi.fn();

vi.mock("./calendar", () => ({
	Calendar: (props: { onSelect?: (date: Date | undefined) => void }) =>
		mockCalendar(props),
}));

vi.mock("./popover", () => ({
	Popover: ({ children }: { children: ReactNode }) => <>{children}</>,
	PopoverContent: ({ children }: { children: ReactNode }) => (
		<div data-testid="popover-content">{children}</div>
	),
	PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("DateTimePicker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCalendar.mockImplementation(
			({ onSelect }: { onSelect?: (date: Date | undefined) => void }) => (
				<div>
					<button
						type="button"
						onClick={() => onSelect?.(new Date(2026, 3, 2))}
					>
						Pick date
					</button>
					<button type="button" onClick={() => onSelect?.(undefined)}>
						Clear date
					</button>
				</div>
			),
		);
	});

	it("formats the selected date and updates the time", () => {
		const onChange = vi.fn();
		render(
			<DateTimePicker
				label="Workout date"
				value={new Date(2026, 3, 1, 8, 30)}
				onChange={onChange}
			/>,
		);

		expect(screen.getByText("Workout date")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Apr 1, 8:30 AM/i }),
		).toBeInTheDocument();

		fireEvent.change(screen.getByDisplayValue("08:30"), {
			target: { value: "09:45" },
		});

		expect(onChange).toHaveBeenCalled();
		const updatedDate = onChange.mock.calls.at(-1)?.[0] as Date;
		expect(updatedDate.getHours()).toBe(9);
		expect(updatedDate.getMinutes()).toBe(45);
	});

	it("selects and clears dates through the calendar popover", () => {
		const onChange = vi.fn();
		render(<DateTimePicker onChange={onChange} />);

		fireEvent.click(screen.getByRole("button", { name: "Pick date" }));

		const selectedDate = onChange.mock.calls.at(-1)?.[0] as Date;
		expect(selectedDate.getFullYear()).toBe(2026);
		expect(selectedDate.getMonth()).toBe(3);
		expect(selectedDate.getDate()).toBe(2);
		expect(selectedDate.getHours()).toBe(0);
		expect(selectedDate.getMinutes()).toBe(0);

		fireEvent.click(screen.getByRole("button", { name: "Clear date" }));
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it("does not emit a time-only change before a date is selected", () => {
		const onChange = vi.fn();
		render(<DateTimePicker disabled onChange={onChange} />);

		expect(screen.queryByText("Workout date")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Pick a date" })).toBeDisabled();

		fireEvent.change(screen.getByDisplayValue("00:00"), {
			target: { value: "07:15" },
		});

		expect(onChange).not.toHaveBeenCalled();
	});
});
