import { userEvent } from "@vitest/browser/context";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
	it("toggles weekdays in sorted order", async () => {
		const onChange = vi.fn();

		const screen = await render(
			<WeekdaySelector selectedWeekdays={[3, 1]} onChange={onChange} />,
		);

		await expect
			.element(screen.getByRole("button", { name: "Monday" }))
			.toHaveAttribute("aria-pressed", "true");
		await expect
			.element(screen.getByRole("button", { name: "Wednesday" }))
			.toHaveAttribute("aria-pressed", "true");

		await userEvent.click(screen.getByRole("button", { name: "Friday" }));

		expect(onChange).toHaveBeenCalledWith([1, 3, 5]);
		await expect
			.element(
				screen.getByText(
					(_, element) =>
						element?.tagName.toLowerCase() === "p" &&
						element.textContent?.includes("Wednesday, Monday") === true,
				),
			)
			.toBeInTheDocument();
	});

	it("does not change weekdays when disabled", async () => {
		const onChange = vi.fn();

		const screen = await render(
			<WeekdaySelector selectedWeekdays={[0]} onChange={onChange} disabled />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Sunday" }));

		expect(onChange).not.toHaveBeenCalled();
		await expect
			.element(screen.getByRole("button", { name: "Sunday" }))
			.toBeDisabled();
	});

	it("removes a selected weekday and hides the summary when none remain", async () => {
		const screen = await render(
			<WeekdaySelectorHarness initialWeekdays={[1]} />,
		);

		await expect.element(screen.getByText(/Selected:/)).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Monday" }));

		await expect.element(screen.getByText(/Selected:/)).not.toBeInTheDocument();
	});

	it("does not render a summary before any weekday is selected", async () => {
		const screen = await render(
			<WeekdaySelector selectedWeekdays={[]} onChange={vi.fn()} />,
		);

		await expect.element(screen.getByText(/Selected:/)).not.toBeInTheDocument();
	});
});
