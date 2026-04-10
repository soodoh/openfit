import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Separator } from "./separator";

describe("Separator", () => {
	it("renders a horizontal decorative separator by default", async () => {
		const screen = await render(<Separator data-testid="separator" />);

		const separator = screen.getByTestId("separator");
		await expect.element(separator).toHaveAttribute("role", "none");
		await expect
			.element(separator)
			.toHaveAttribute("data-orientation", "horizontal");
	});

	it("renders a vertical separator and forwards custom props", async () => {
		const screen = await render(
			<Separator
				data-testid="separator"
				orientation="vertical"
				decorative={false}
				className="custom-separator"
			/>,
		);

		const separator = screen.getByTestId("separator");
		await expect
			.element(separator)
			.toHaveAttribute("data-orientation", "vertical");
		await expect.element(separator).toHaveClass("custom-separator");
		await expect.element(separator).toHaveAttribute("role", "separator");
	});
});
