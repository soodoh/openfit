import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { WeekdaySelector } from "./weekday-selector";

function WeekdaySelectorHarness({
	initialWeekdays,
}: {
	initialWeekdays: number[];
}) {
	const [selectedWeekdays, setSelectedWeekdays] = useState(initialWeekdays);

	return (
		<WeekdaySelector
			selectedWeekdays={selectedWeekdays}
			onChange={setSelectedWeekdays}
		/>
	);
}

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

	it("removes a selected weekday and hides the summary when none remain", () => {
		render(<WeekdaySelectorHarness initialWeekdays={[1]} />);

		expect(screen.getByText(/Selected:/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Monday" }));

		expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
	});
});
