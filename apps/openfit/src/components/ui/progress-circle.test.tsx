import { page } from "@vitest/browser/context";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { ProgressCircle } from "./progress-circle";

describe("ProgressCircle", () => {
	describe("rendering", () => {
		it("renders with default props", async () => {
			render(<ProgressCircle value={50} />);
			await expect.element(page.locator("svg")).toBeInTheDocument();
		});

		it("renders children when provided", async () => {
			render(
				<ProgressCircle value={75}>
					<span data-testid="child">75%</span>
				</ProgressCircle>,
			);
			await expect
				.element(page.locator("[data-testid='child']"))
				.toBeInTheDocument();
			await expect.element(page.locator("text=75%")).toBeInTheDocument();
		});

		it("renders two circles (background and progress)", async () => {
			render(<ProgressCircle value={50} />);
			const svgEl = await page.locator("svg").element();
			const circles = svgEl.querySelectorAll("circle");
			expect(circles).toHaveLength(2);
		});
	});
	describe("dimensions", () => {
		it("uses default size of 100", async () => {
			render(<ProgressCircle value={50} />);
			const wrapper = await page.locator("div").first().element();
			expect(wrapper.getAttribute("style")).toMatch(/width:\s*100px/);
			expect(wrapper.getAttribute("style")).toMatch(/height:\s*100px/);
		});

		it("applies custom size", async () => {
			render(<ProgressCircle value={50} size={200} />);
			const wrapper = await page.locator("div").first().element();
			expect(wrapper.getAttribute("style")).toMatch(/width:\s*200px/);
			expect(wrapper.getAttribute("style")).toMatch(/height:\s*200px/);
		});

		it("applies custom className", async () => {
			render(<ProgressCircle value={50} className="custom-class" />);
			await expect.element(page.locator(".custom-class")).toBeInTheDocument();
		});
	});
	describe("SVG calculations", () => {
		it("calculates correct radius based on size and strokeWidth", async () => {
			const size = 100;
			const strokeWidth = 4;
			const expectedRadius = (size - strokeWidth) / 2;
			render(
				<ProgressCircle value={50} size={size} strokeWidth={strokeWidth} />,
			);
			const svgEl = await page.locator("svg").element();
			const circle = svgEl.querySelector("circle");
			expect(circle?.getAttribute("r")).toBe(String(expectedRadius));
		});

		it("calculates correct center coordinates", async () => {
			const size = 100;
			render(<ProgressCircle value={50} size={size} />);
			const svgEl = await page.locator("svg").element();
			const circle = svgEl.querySelector("circle");
			expect(circle?.getAttribute("cx")).toBe(String(size / 2));
			expect(circle?.getAttribute("cy")).toBe(String(size / 2));
		});

		it("applies correct strokeWidth", async () => {
			const strokeWidth = 8;
			render(<ProgressCircle value={50} strokeWidth={strokeWidth} />);
			const svgEl = await page.locator("svg").element();
			const circles = svgEl.querySelectorAll("circle");
			for (const circle of circles) {
				expect(circle.getAttribute("stroke-width")).toBe(String(strokeWidth));
			}
		});
	});
	describe("progress values", () => {
		it("handles 0% progress", async () => {
			render(<ProgressCircle value={0} />);
			const circumference = 48 * 2 * Math.PI; // radius = (100 - 4) / 2 = 48
			const svgEl = await page.locator("svg").element();
			const progressCircle = svgEl.querySelectorAll("circle")[1];
			expect(progressCircle?.getAttribute("stroke-dashoffset")).toBe(
				String(circumference),
			);
		});

		it("handles 100% progress", async () => {
			render(<ProgressCircle value={100} />);
			const svgEl = await page.locator("svg").element();
			const progressCircle = svgEl.querySelectorAll("circle")[1];
			expect(progressCircle?.getAttribute("stroke-dashoffset")).toBe("0");
		});

		it("handles 50% progress", async () => {
			render(<ProgressCircle value={50} />);
			const circumference = 48 * 2 * Math.PI;
			const expectedOffset = circumference - 0.5 * circumference;
			const svgEl = await page.locator("svg").element();
			const progressCircle = svgEl.querySelectorAll("circle")[1];
			expect(progressCircle?.getAttribute("stroke-dashoffset")).toBe(
				String(expectedOffset),
			);
		});
	});
});
