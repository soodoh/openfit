import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { ProgressCircle } from "./progress-circle";

describe("ProgressCircle", () => {
	describe("rendering", () => {
		it("renders with default props", async () => {
			const screen = await render(<ProgressCircle value={50} />);
			expect(screen.container.querySelector("svg")).toBeTruthy();
		});

		it("renders children when provided", async () => {
			const screen = await render(
				<ProgressCircle value={75}>
					<span data-testid="child">75%</span>
				</ProgressCircle>,
			);
			await expect.element(screen.getByTestId("child")).toBeInTheDocument();
			await expect.element(screen.getByText("75%")).toBeInTheDocument();
		});

		it("renders two circles (background and progress)", async () => {
			const screen = await render(<ProgressCircle value={50} />);
			const circles = screen.container.querySelectorAll("circle");
			expect(circles).toHaveLength(2);
		});
	});
	describe("dimensions", () => {
		it("uses default size of 100", async () => {
			const screen = await render(<ProgressCircle value={50} />);
			const wrapper = screen.container.firstChild as HTMLElement;
			expect(wrapper.getAttribute("style")).toMatch(/width:\s*100px/);
			expect(wrapper.getAttribute("style")).toMatch(/height:\s*100px/);
		});

		it("applies custom size", async () => {
			const screen = await render(<ProgressCircle value={50} size={200} />);
			const wrapper = screen.container.firstChild as HTMLElement;
			expect(wrapper.getAttribute("style")).toMatch(/width:\s*200px/);
			expect(wrapper.getAttribute("style")).toMatch(/height:\s*200px/);
		});

		it("applies custom className", async () => {
			const screen = await render(
				<ProgressCircle value={50} className="custom-class" />,
			);
			expect(screen.container.querySelector(".custom-class")).toBeTruthy();
		});
	});
	describe("SVG calculations", () => {
		it("calculates correct radius based on size and strokeWidth", async () => {
			const size = 100;
			const strokeWidth = 4;
			const expectedRadius = (size - strokeWidth) / 2;
			const screen = await render(
				<ProgressCircle value={50} size={size} strokeWidth={strokeWidth} />,
			);
			const circle = screen.container.querySelector("circle");
			expect(circle?.getAttribute("r")).toBe(String(expectedRadius));
		});

		it("calculates correct center coordinates", async () => {
			const size = 100;
			const screen = await render(<ProgressCircle value={50} size={size} />);
			const circle = screen.container.querySelector("circle");
			expect(circle?.getAttribute("cx")).toBe(String(size / 2));
			expect(circle?.getAttribute("cy")).toBe(String(size / 2));
		});

		it("applies correct strokeWidth", async () => {
			const strokeWidth = 8;
			const screen = await render(
				<ProgressCircle value={50} strokeWidth={strokeWidth} />,
			);
			const circles = screen.container.querySelectorAll("circle");
			for (const circle of circles) {
				expect(circle.getAttribute("stroke-width")).toBe(String(strokeWidth));
			}
		});
	});
	describe("progress values", () => {
		it("handles 0% progress", async () => {
			const screen = await render(<ProgressCircle value={0} />);
			const circumference = 48 * 2 * Math.PI;
			const progressCircle = screen.container.querySelectorAll("circle")[1];
			expect(progressCircle?.getAttribute("stroke-dashoffset")).toBe(
				String(circumference),
			);
		});

		it("handles 100% progress", async () => {
			const screen = await render(<ProgressCircle value={100} />);
			const progressCircle = screen.container.querySelectorAll("circle")[1];
			expect(progressCircle?.getAttribute("stroke-dashoffset")).toBe("0");
		});

		it("handles 50% progress", async () => {
			const screen = await render(<ProgressCircle value={50} />);
			const circumference = 48 * 2 * Math.PI;
			const expectedOffset = circumference - 0.5 * circumference;
			const progressCircle = screen.container.querySelectorAll("circle")[1];
			expect(progressCircle?.getAttribute("stroke-dashoffset")).toBe(
				String(expectedOffset),
			);
		});
	});
});
