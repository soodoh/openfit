import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RestTimer } from "./rest-timer";

dayjs.extend(duration);

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: {
		children: ReactNode;
		[key: string]: unknown;
	}) => <button {...props}>{children}</button>,
}));

describe("RestTimer", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-08T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders a finite progress ring when the timer length is zero", () => {
		const timer = {
			isRunning: false,
			totalSeconds: 0,
			start: vi.fn(),
			pause: vi.fn(),
			restart: vi.fn(),
		};

		const { container } = render(
			<RestTimer
				open
				setOpen={vi.fn()}
				totalSeconds={0}
				setTotalSeconds={vi.fn()}
				timer={timer}
			/>,
		);

		const progressCircle = container.querySelector("circle[stroke-dasharray]");
		expect(progressCircle).not.toBeNull();
		expect(progressCircle?.getAttribute("stroke-dashoffset")).not.toBe("NaN");
	});

	it("can reset and skip the timer from the dialog controls", () => {
		const setOpen = vi.fn();
		const setTotalSeconds = vi.fn();
		const restart = vi.fn();
		const timer = {
			isRunning: true,
			totalSeconds: 30,
			start: vi.fn(),
			pause: vi.fn(),
			restart,
		};

		render(
			<RestTimer
				open
				setOpen={setOpen}
				totalSeconds={30}
				setTotalSeconds={setTotalSeconds}
				timer={timer}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Reset rest timer" }));
		fireEvent.click(screen.getByRole("button", { name: "Skip rest timer" }));

		expect(restart).toHaveBeenNthCalledWith(
			1,
			dayjs("2026-04-08T12:00:00.000Z").add(30, "seconds").toDate(),
			false,
		);
		expect(setOpen).toHaveBeenCalledWith(false);
		expect(setTotalSeconds).not.toHaveBeenCalled();
	});

	it("can adjust the timer and start it from the dialog controls", () => {
		const timer = {
			isRunning: false,
			totalSeconds: 40,
			start: vi.fn(),
			pause: vi.fn(),
			restart: vi.fn(),
		};

		render(
			<RestTimer
				open
				setOpen={vi.fn()}
				totalSeconds={40}
				setTotalSeconds={vi.fn()}
				timer={timer}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Decrease rest timer by 10 seconds" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Increase rest timer by 10 seconds" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Start rest timer" }));

		expect(timer.restart).toHaveBeenNthCalledWith(
			1,
			dayjs("2026-04-08T12:00:00.000Z").add(30, "seconds").toDate(),
			false,
		);
		expect(timer.restart).toHaveBeenNthCalledWith(
			2,
			dayjs("2026-04-08T12:00:00.000Z").add(50, "seconds").toDate(),
			false,
		);
		expect(timer.start).toHaveBeenCalledTimes(1);
	});

	it("pauses the timer when it is already running", () => {
		const timer = {
			isRunning: true,
			totalSeconds: 40,
			start: vi.fn(),
			pause: vi.fn(),
			restart: vi.fn(),
		};

		render(
			<RestTimer
				open
				setOpen={vi.fn()}
				totalSeconds={40}
				setTotalSeconds={vi.fn()}
				timer={timer}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Pause rest timer" }));

		expect(timer.pause).toHaveBeenCalledTimes(1);
		expect(timer.start).not.toHaveBeenCalled();
	});
});
