import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressCircle } from "./progress-circle";

describe("ProgressCircle", () => {
  describe("rendering", () => {
    it("renders with default props", () => {
      const { container } = render(<ProgressCircle value={50} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders children when provided", () => {
      render(
        <ProgressCircle value={75}>
          <span data-testid="child">75%</span>
        </ProgressCircle>,
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("renders two circles (background and progress)", () => {
      const { container } = render(<ProgressCircle value={50} />);
      const circles = container.querySelectorAll("circle");
      expect(circles).toHaveLength(2);
    });
  });

  describe("dimensions", () => {
    it("uses default size of 100", () => {
      const { container } = render(<ProgressCircle value={50} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ width: "100px", height: "100px" });
    });

    it("applies custom size", () => {
      const { container } = render(<ProgressCircle value={50} size={200} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ width: "200px", height: "200px" });
    });

    it("applies custom className", () => {
      const { container } = render(
        <ProgressCircle value={50} className="custom-class" />,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  describe("SVG calculations", () => {
    it("calculates correct radius based on size and strokeWidth", () => {
      const size = 100;
      const strokeWidth = 4;
      const expectedRadius = (size - strokeWidth) / 2;

      const { container } = render(
        <ProgressCircle value={50} size={size} strokeWidth={strokeWidth} />,
      );
      const circle = container.querySelector("circle");
      expect(circle).toHaveAttribute("r", String(expectedRadius));
    });

    it("calculates correct center coordinates", () => {
      const size = 100;
      const { container } = render(<ProgressCircle value={50} size={size} />);
      const circle = container.querySelector("circle");
      expect(circle).toHaveAttribute("cx", String(size / 2));
      expect(circle).toHaveAttribute("cy", String(size / 2));
    });

    it("applies correct strokeWidth", () => {
      const strokeWidth = 8;
      const { container } = render(
        <ProgressCircle value={50} strokeWidth={strokeWidth} />,
      );
      const circles = container.querySelectorAll("circle");
      circles.forEach((circle) => {
        expect(circle).toHaveAttribute("stroke-width", String(strokeWidth));
      });
    });
  });

  describe("progress values", () => {
    it("handles 0% progress", () => {
      const { container } = render(<ProgressCircle value={0} />);
      const progressCircle = container.querySelectorAll("circle")[1];
      const circumference = 48 * 2 * Math.PI; // radius = (100 - 4) / 2 = 48
      expect(progressCircle).toHaveAttribute(
        "stroke-dashoffset",
        String(circumference),
      );
    });

    it("handles 100% progress", () => {
      const { container } = render(<ProgressCircle value={100} />);
      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle).toHaveAttribute("stroke-dashoffset", "0");
    });

    it("handles 50% progress", () => {
      const { container } = render(<ProgressCircle value={50} />);
      const progressCircle = container.querySelectorAll("circle")[1];
      const circumference = 48 * 2 * Math.PI;
      const expectedOffset = circumference - 0.5 * circumference;
      expect(progressCircle).toHaveAttribute(
        "stroke-dashoffset",
        String(expectedOffset),
      );
    });
  });
});
