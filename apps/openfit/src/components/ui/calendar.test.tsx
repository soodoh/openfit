import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	it("focuses the day button when the focused modifier is set", async () => {
		const screen = await render(
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
		await expect.element(button).toHaveFocus();
		await expect
			.element(button)
			.toHaveAttribute("data-selected-single", "true");
		await expect
			.element(button)
			.toHaveAttribute("data-day", new Date(2026, 3, 1).toLocaleDateString());
	});

	it("configures day picker classes and custom components", async () => {
		const screen = await render(
			<Calendar captionLayout="dropdown" className="custom-calendar" />,
		);

		await expect
			.element(screen.getByTestId("day-picker"))
			.toHaveClass("custom-calendar");
		await expect
			.element(screen.getByTestId("calendar-root"))
			.toHaveAttribute("data-slot", "calendar");
		await expect
			.element(screen.getByTestId("calendar-root"))
			.toHaveClass("w-fit");
		await expect
			.element(screen.getByTestId("formatted-month"))
			.toHaveTextContent("Apr");
		await expect
			.element(screen.getByTestId("caption-layout"))
			.toHaveTextContent("dropdown");
		await expect
			.element(screen.getByText("1", { exact: true }))
			.toHaveAttribute("data-range-start", "false");
		await expect.element(screen.getByLabelText("Selected day")).toHaveFocus();
		expect(
			screen.getByTestId("calendar-chevrons").element().querySelectorAll("svg")
				.length,
		).toBe(3);
	});
});
