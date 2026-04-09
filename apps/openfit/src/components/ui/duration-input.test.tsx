import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { DurationInput, parseDurationToSeconds } from "./duration-input";

describe("parseDurationToSeconds", () => {
	describe("basic parsing", () => {
		it("parses MM:ss format correctly", () => {
			expect(parseDurationToSeconds("1:30")).toBe(90);
			expect(parseDurationToSeconds("2:00")).toBe(120);
			expect(parseDurationToSeconds("10:45")).toBe(645);
		});

		it("parses minutes only (no colon)", () => {
			expect(parseDurationToSeconds("5")).toBe(300);
			expect(parseDurationToSeconds("10")).toBe(600);
			expect(parseDurationToSeconds("60")).toBe(3600);
		});

		it("parses with leading zeros", () => {
			expect(parseDurationToSeconds("01:05")).toBe(65);
			expect(parseDurationToSeconds("00:30")).toBe(30);
		});
	});

	describe("edge cases", () => {
		it("returns undefined for empty string", () => {
			expect(parseDurationToSeconds("")).toBeUndefined();
		});

		it("handles zero values", () => {
			expect(parseDurationToSeconds("0")).toBe(0);
			expect(parseDurationToSeconds("0:00")).toBe(0);
			expect(parseDurationToSeconds("0:0")).toBe(0);
		});

		it("handles colon with missing seconds", () => {
			expect(parseDurationToSeconds("5:")).toBe(300);
		});

		it("handles colon with missing minutes", () => {
			expect(parseDurationToSeconds(":30")).toBe(30);
		});

		it("handles large minute values", () => {
			expect(parseDurationToSeconds("120:00")).toBe(7200);
			expect(parseDurationToSeconds("999:59")).toBe(59_999);
		});
	});

	describe("seconds boundary", () => {
		it("handles 59 seconds", () => {
			expect(parseDurationToSeconds("1:59")).toBe(119);
		});

		it("handles single digit seconds", () => {
			expect(parseDurationToSeconds("1:5")).toBe(65);
			expect(parseDurationToSeconds("1:9")).toBe(69);
		});
	});
});

describe("DurationInput", () => {
	it("emits valid duration strings and ignores invalid input", () => {
		const onChange = vi.fn();

		function Harness() {
			const [value, setValue] = React.useState("");
			return React.createElement(DurationInput, {
				value,
				onChange: (next) => {
					onChange(next);
					setValue(next);
				},
				"aria-label": "Duration",
			});
		}

		render(React.createElement(Harness));

		fireEvent.change(screen.getByLabelText("Duration"), {
			target: { value: "12:34" },
		});
		expect(onChange).toHaveBeenCalledWith("12:34");

		fireEvent.change(screen.getByLabelText("Duration"), {
			target: { value: "1:60" },
		});
		expect(onChange).toHaveBeenCalledTimes(1);

		fireEvent.change(screen.getByLabelText("Duration"), {
			target: { value: "" },
		});
		expect(onChange).toHaveBeenCalledWith("");
	});
});
