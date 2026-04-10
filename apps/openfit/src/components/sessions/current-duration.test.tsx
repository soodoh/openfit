import { page } from "@vitest/browser/context";
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
		const { unmount } = await render(<CurrentDuration startTime={startTime} />);

		await expect.element(page.locator("text=Duration")).toBeInTheDocument();
		await expect
			.element(page.locator("p.text-base"))
			.toHaveTextContent("1:02:03");

		act(() => {
			vi.advanceTimersByTime(1000);
		});

		await expect
			.element(page.locator("p.text-base"))
			.toHaveTextContent("1:02:04");
		unmount();
	});
});
