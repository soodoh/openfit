import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { DurationInput, parseDurationToSeconds } from "./duration-input";

describe("parseDurationToSeconds", () => {
	describe("basic parsing", () => {
		it("parses MM:ss format correctly", async () => {
			expect(parseDurationToSeconds("1:30")).toBe(90);
			expect(parseDurationToSeconds("2:00")).toBe(120);
			expect(parseDurationToSeconds("10:45")).toBe(645);
		});

		it("parses minutes only (no colon)", async () => {
			expect(parseDurationToSeconds("5")).toBe(300);
			expect(parseDurationToSeconds("10")).toBe(600);
			expect(parseDurationToSeconds("60")).toBe(3600);
		});

		it("parses with leading zeros", async () => {
			expect(parseDurationToSeconds("01:05")).toBe(65);
			expect(parseDurationToSeconds("00:30")).toBe(30);
		});
	});

	describe("edge cases", () => {
		it("returns undefined for empty string", async () => {
			expect(parseDurationToSeconds("")).toBeUndefined();
		});

		it("handles zero values", async () => {
			expect(parseDurationToSeconds("0")).toBe(0);
			expect(parseDurationToSeconds("0:00")).toBe(0);
			expect(parseDurationToSeconds("0:0")).toBe(0);
		});

		it("handles colon with missing seconds", async () => {
			expect(parseDurationToSeconds("5:")).toBe(300);
		});

		it("handles colon with missing minutes", async () => {
			expect(parseDurationToSeconds(":30")).toBe(30);
		});

		it("handles large minute values", async () => {
			expect(parseDurationToSeconds("120:00")).toBe(7200);
			expect(parseDurationToSeconds("999:59")).toBe(59_999);
		});
	});

	describe("seconds boundary", () => {
		it("handles 59 seconds", async () => {
			expect(parseDurationToSeconds("1:59")).toBe(119);
		});

		it("handles single digit seconds", async () => {
			expect(parseDurationToSeconds("1:5")).toBe(65);
			expect(parseDurationToSeconds("1:9")).toBe(69);
		});
	});
});

describe("DurationInput", () => {
	it("emits valid duration strings and ignores invalid input", async () => {
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

		const screen = await render(React.createElement(Harness));

		await screen.getByLabelText("Duration").fill("12:34");
		expect(onChange).toHaveBeenCalledWith("12:34");

		await screen.getByLabelText("Duration").fill("1:60");
		expect(onChange).toHaveBeenCalledTimes(1);

		await screen.getByLabelText("Duration").fill("");
		expect(onChange).toHaveBeenCalledWith("");
	});

	it("rejects malformed duration input", async () => {
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

		const screen = await render(React.createElement(Harness));

		for (const nextValue of ["1a:30", "12::30", "1234", "1:60", "1:70"]) {
			await screen.getByLabelText("Duration").fill(nextValue);
		}

		expect(onChange).not.toHaveBeenCalled();
	});

	it("rejects overlong minute and second values", async () => {
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

		const screen = await render(React.createElement(Harness));

		await screen.getByLabelText("Duration").fill("1234:5");
		await screen.getByLabelText("Duration").fill("12:345");
		await screen.getByLabelText("Duration").fill("1:6");

		expect(onChange).not.toHaveBeenCalled();
	});
});
