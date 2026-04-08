import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
	it("renders a horizontal decorative separator by default", () => {
		render(<Separator data-testid="separator" />);

		const separator = screen.getByTestId("separator");
		expect(separator).toHaveAttribute("data-orientation", "horizontal");
		expect(separator).toHaveClass("bg-border");
		expect(separator).toHaveClass("h-px");
		expect(separator).toHaveClass("w-full");
	});

	it("renders a vertical separator and forwards custom props", () => {
		render(
			<Separator
				data-testid="separator"
				orientation="vertical"
				decorative={false}
				className="custom-separator"
			/>,
		);

		const separator = screen.getByTestId("separator");
		expect(separator).toHaveAttribute("data-orientation", "vertical");
		expect(separator).toHaveClass("h-full");
		expect(separator).toHaveClass("w-px");
		expect(separator).toHaveClass("custom-separator");
		expect(separator).toHaveAttribute("role", "separator");
	});
});
