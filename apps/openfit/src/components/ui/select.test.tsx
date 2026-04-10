import { userEvent } from "@vitest/browser/context";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

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
	it("shows placeholder, opens options, and updates selected value", async () => {
		const screen = await render(<TestSelect />);

		const trigger = screen.getByRole("combobox", { name: "Exercise" });
		await expect.element(trigger).toHaveClass("trigger-custom");
		await expect.element(screen.getByText("Pick exercise")).toBeInTheDocument();

		await userEvent.click(trigger);

		const listbox = screen.getByRole("listbox");
		await expect.element(listbox.getByText("Main lifts")).toBeInTheDocument();
		await expect
			.element(listbox.getByRole("option", { name: "Squat" }))
			.toBeInTheDocument();
		await expect
			.element(listbox.getByRole("option", { name: "Bench" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("select-separator"))
			.toHaveClass("separator-custom");

		await userEvent.click(listbox.getByRole("option", { name: "Bench" }));

		await expect
			.element(screen.getByRole("combobox", { name: "Exercise" }))
			.toHaveTextContent("Bench");
	});

	it("supports non-popper content positioning with the same user behavior", async () => {
		const screen = await render(<TestSelect position="item-aligned" />);

		const trigger = screen.getByRole("combobox", { name: "Exercise" });
		await userEvent.click(trigger);

		const listbox = screen.getByRole("listbox");
		await userEvent.click(listbox.getByRole("option", { name: "Squat" }));

		await expect
			.element(screen.getByRole("combobox", { name: "Exercise" }))
			.toHaveTextContent("Squat");
	});
});
