import { render, screen } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar, CalendarDayButton } from "./calendar";

type WrapperProps = Record<string, unknown>;
type CalendarDayButtonProps = React.ComponentProps<typeof CalendarDayButton>;

const mockDayPicker = vi.fn(
	({
		className,
		components,
		classNames,
		formatters,
		captionLayout,
	}: {
		className?: string;
		components?: Record<string, React.ComponentType<WrapperProps>>;
		classNames?: Record<string, string>;
		formatters?: { formatMonthDropdown?: (date: Date) => string };
		captionLayout?: string;
	}) => {
		const Root =
			components?.Root ?? ((props: WrapperProps) => <div {...props} />);
		const Chevron =
			components?.Chevron ?? ((props: WrapperProps) => <span {...props} />);
		const DayButton =
			components?.DayButton ?? ((props: WrapperProps) => <button {...props} />);
		const WeekNumber =
			components?.WeekNumber ?? ((props: WrapperProps) => <td {...props} />);

		return (
			<div data-testid="day-picker" className={className}>
				<Root
					className={classNames?.root}
					rootRef={React.createRef()}
					data-testid="calendar-root"
				/>
				<div data-testid="calendar-chevrons">
					<Chevron orientation="left" className="left-chevron" />
					<Chevron orientation="right" className="right-chevron" />
					<Chevron orientation="up" className="up-chevron" />
				</div>
				<table>
					<tbody>
						<tr>
							<WeekNumber>12</WeekNumber>
						</tr>
					</tbody>
				</table>
				<DayButton
					day={{ date: new Date(2026, 3, 1) }}
					modifiers={{
						focused: true,
						selected: true,
						range_start: false,
						range_end: false,
						range_middle: false,
					}}
					aria-label="Selected day"
					data-testid="day-button"
				>
					1
				</DayButton>
				<div data-testid="formatted-month">
					{formatters?.formatMonthDropdown?.(new Date(2026, 3, 1))}
				</div>
				<div data-testid="caption-layout">{captionLayout}</div>
			</div>
		);
	},
);

vi.mock("react-day-picker", () => ({
	DayPicker: (...args: unknown[]) => mockDayPicker(...args),
}));

describe("calendar wrappers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("focuses the day button when the focused modifier is set", () => {
		render(
			<CalendarDayButton
				day={{ date: new Date(2026, 3, 1) } as CalendarDayButtonProps["day"]}
				modifiers={
					{
						focused: true,
						selected: true,
						range_start: false,
						range_end: false,
						range_middle: false,
					} as CalendarDayButtonProps["modifiers"]
				}
				aria-label="Selected day"
			>
				1
			</CalendarDayButton>,
		);

		const button = screen.getByRole("button", { name: "Selected day" });
		expect(button).toHaveFocus();
		expect(button).toHaveAttribute("data-selected-single", "true");
		expect(button).toHaveAttribute(
			"data-day",
			new Date(2026, 3, 1).toLocaleDateString(),
		);
	});

	it("configures day picker classes and custom components", () => {
		render(<Calendar captionLayout="dropdown" className="custom-calendar" />);

		expect(screen.getByTestId("day-picker")).toHaveClass("custom-calendar");
		expect(screen.getByTestId("calendar-root")).toHaveAttribute(
			"data-slot",
			"calendar",
		);
		expect(screen.getByTestId("calendar-root")).toHaveClass("w-fit");
		expect(screen.getByTestId("formatted-month")).toHaveTextContent("Apr");
		expect(screen.getByTestId("caption-layout")).toHaveTextContent("dropdown");
		expect(screen.getByText("1")).toHaveAttribute("data-range-start", "false");
		expect(screen.getByLabelText("Selected day")).toHaveFocus();
		expect(
			screen.getByTestId("calendar-chevrons").querySelectorAll("svg").length,
		).toBe(3);
	});
});
