import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

		fireEvent.click(screen.getByRole("button", { name: "Reset" }));
		fireEvent.click(screen.getByRole("button", { name: "Skip" }));

		expect(restart).toHaveBeenNthCalledWith(
			1,
			dayjs("2026-04-08T12:00:00.000Z").add(30, "seconds").toDate(),
			false,
		);
		expect(setOpen).toHaveBeenCalledWith(false);
		expect(setTotalSeconds).not.toHaveBeenCalled();
	});
});
