import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	it("renders the elapsed time and updates on interval", async () => {
		const startTime = new Date("2026-04-08T10:57:57.000Z");
		const screen = await render(<CurrentDuration startTime={startTime} />);

		await expect.element(screen.getByText("Duration")).toBeInTheDocument();
		const valueEl = screen.container.querySelector("p.text-base");
		expect(valueEl?.textContent).toBe("1:02:03");

		act(() => {
			vi.advanceTimersByTime(1000);
		});

		const updatedValue = screen.container.querySelector("p.text-base");
		expect(updatedValue?.textContent).toBe("1:02:04");
		await screen.unmount();
	});
});
