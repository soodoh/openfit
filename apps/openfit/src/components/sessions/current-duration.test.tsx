import { act, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CurrentDuration } from "./current-duration";

dayjs.extend(duration);

describe("CurrentDuration", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-08T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders the elapsed time and updates on interval", () => {
		const startTime = new Date("2026-04-08T10:57:57.000Z");
		const { container, unmount } = render(
			<CurrentDuration startTime={startTime} />,
		);

		expect(screen.getByText("Duration")).toBeInTheDocument();
		expect(container.querySelector("p.text-base")).toHaveTextContent("1:02:03");

		act(() => {
			vi.advanceTimersByTime(1000);
		});

		expect(container.querySelector("p.text-base")).toHaveTextContent("1:02:04");
		unmount();
	});
});
