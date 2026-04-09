import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WeekdaySelector } from "./weekday-selector";

describe("WeekdaySelector", () => {
	it("toggles weekdays in sorted order", () => {
		const onChange = vi.fn();

		render(<WeekdaySelector selectedWeekdays={[3, 1]} onChange={onChange} />);

		expect(screen.getByRole("button", { name: "Monday" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "Wednesday" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		fireEvent.click(screen.getByRole("button", { name: "Friday" }));

		expect(onChange).toHaveBeenCalledWith([1, 3, 5]);
		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName.toLowerCase() === "p" &&
					element.textContent?.includes("Wednesday, Monday") === true,
			),
		).toBeInTheDocument();
	});

	it("does not change weekdays when disabled", () => {
		const onChange = vi.fn();

		render(
			<WeekdaySelector selectedWeekdays={[0]} onChange={onChange} disabled />,
		);

		fireEvent.click(screen.getByRole("button", { name: "Sunday" }));

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Sunday" })).toBeDisabled();
	});
});
