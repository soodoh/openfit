import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./select";

const originalHasPointerCapture = Element.prototype.hasPointerCapture;
const originalScrollIntoView = Element.prototype.scrollIntoView;

beforeAll(() => {
	if (!Element.prototype.hasPointerCapture) {
		Element.prototype.hasPointerCapture = () => false;
	}
	if (!Element.prototype.scrollIntoView) {
		Element.prototype.scrollIntoView = () => {};
	}
});

afterAll(() => {
	Element.prototype.hasPointerCapture = originalHasPointerCapture;
	Element.prototype.scrollIntoView = originalScrollIntoView;
});

function TestSelect({
	position = "popper",
}: {
	position?: "popper" | "item-aligned";
}) {
	return (
		<Select>
			<SelectTrigger className="trigger-custom" aria-label="Exercise">
				<SelectValue placeholder="Pick exercise" />
			</SelectTrigger>
			<SelectContent position={position}>
				<SelectGroup>
					<SelectLabel>Main lifts</SelectLabel>
					<SelectItem value="squat">Squat</SelectItem>
					<SelectSeparator
						data-testid="select-separator"
						className="separator-custom"
					/>
					<SelectItem value="bench">Bench</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

describe("Select", () => {
	it("shows placeholder, opens options, and updates selected value", () => {
		render(<TestSelect />);

		const trigger = screen.getByRole("combobox", { name: "Exercise" });
		expect(trigger).toHaveClass("trigger-custom");
		expect(screen.getByText("Pick exercise")).toBeInTheDocument();

		fireEvent.pointerDown(trigger, {
			button: 0,
			ctrlKey: false,
			pointerType: "mouse",
		});

		const listbox = screen.getByRole("listbox");
		expect(within(listbox).getByText("Main lifts")).toBeInTheDocument();
		expect(
			within(listbox).getByRole("option", { name: "Squat" }),
		).toBeInTheDocument();
		expect(
			within(listbox).getByRole("option", { name: "Bench" }),
		).toBeInTheDocument();
		expect(screen.getByTestId("select-separator")).toHaveClass(
			"separator-custom",
		);

		fireEvent.click(within(listbox).getByRole("option", { name: "Bench" }));

		expect(
			screen.getByRole("combobox", { name: "Exercise" }),
		).toHaveTextContent("Bench");
	});

	it("supports non-popper content positioning with the same user behavior", () => {
		render(<TestSelect position="item-aligned" />);

		const trigger = screen.getByRole("combobox", { name: "Exercise" });
		fireEvent.pointerDown(trigger, {
			button: 0,
			ctrlKey: false,
			pointerType: "mouse",
		});

		const listbox = screen.getByRole("listbox");
		fireEvent.click(within(listbox).getByRole("option", { name: "Squat" }));

		expect(
			screen.getByRole("combobox", { name: "Exercise" }),
		).toHaveTextContent("Squat");
	});
});
