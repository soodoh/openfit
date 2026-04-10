import { userEvent } from "@vitest/browser/context";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SessionSummaryCard } from "./session-summary-card";

dayjs.extend(duration);

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

vi.mock("./edit-session-menu", () => ({
	EditSessionMenu: () => <button type="button">Edit session menu</button>,
}));

describe("SessionSummaryCard", () => {
	it("links to the workout view for active sessions and hides the edit menu when requested", async () => {
		const screen = await render(
			<SessionSummaryCard
				session={{
					id: "session-1",
					name: "Upper Day",
					startTime: new Date("2026-04-01T08:00:00.000Z"),
					endTime: new Date("2026-04-01T09:15:00.000Z"),
					impression: 5,
					notes: "Strong set",
					setGroups: [{ sets: [1, 2] }],
				}}
				isActive
				showEditMenu={false}
			/>,
		);

		await expect
			.element(screen.getByRole("link"))
			.toHaveAttribute("href", "/workout");
		await expect.element(screen.getByText("1h 15m")).toBeInTheDocument();
		await expect.element(screen.getByText("2 sets")).toBeInTheDocument();
		await expect.element(screen.getByText("Strong set")).toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Edit session menu" }))
			.not.toBeInTheDocument();
	});

	it("links completed sessions to logs and shows the edit menu by default", async () => {
		const screen = await render(
			<SessionSummaryCard
				session={{
					id: "session-3",
					name: "Pull Day",
					startTime: new Date("2026-04-01T08:00:00.000Z"),
					endTime: new Date("2026-04-01T08:45:00.000Z"),
					impression: null,
					notes: null,
					setGroups: [],
				}}
			/>,
		);

		await expect
			.element(screen.getByRole("link"))
			.toHaveAttribute("href", "/logs");
		await expect
			.element(screen.getByRole("button", { name: "Edit session menu" }))
			.toBeInTheDocument();
		await expect.element(screen.getByText("45 min")).toBeInTheDocument();
	});

	it("renders as a button when an onClick handler is provided", async () => {
		const onClick = vi.fn();

		const screen = await render(
			<SessionSummaryCard
				session={{
					id: "session-2",
					name: "Push Day",
					startTime: new Date("2026-04-01T08:00:00.000Z"),
					endTime: null,
					impression: null,
					setGroups: [],
				}}
				onClick={onClick}
				showEditMenu
			/>,
		);

		await userEvent.click(screen.getByText("Push Day"));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("stops pointer down from reaching the card when the edit menu is interacted with", async () => {
		const onClick = vi.fn();

		const screen = await render(
			<SessionSummaryCard
				session={{
					id: "session-4",
					name: "Accessory Day",
					startTime: new Date("2026-04-01T08:00:00.000Z"),
					endTime: new Date("2026-04-01T08:30:00.000Z"),
					impression: null,
					notes: null,
					setGroups: [],
				}}
				onClick={onClick}
				showEditMenu
			/>,
		);

		// Fire pointerdown only (not a full click) to test stopPropagation
		screen
			.getByRole("button", { name: "Edit session menu" })
			.nth(1)
			.element()
			.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
		expect(onClick).not.toHaveBeenCalled();
	});

	it("omits duration text when the session is still in progress and uses the singular set label", async () => {
		const screen = await render(
			<SessionSummaryCard
				session={{
					id: "session-5",
					name: "Singles Day",
					startTime: new Date("2026-04-01T08:00:00.000Z"),
					endTime: null,
					impression: null,
					notes: null,
					setGroups: [{ sets: [1] }],
				}}
			/>,
		);

		await expect.element(screen.getByText("1 set")).toBeInTheDocument();
		await expect.element(screen.getByText(/ min$/)).not.toBeInTheDocument();
		await expect.element(screen.getByText(/ h /)).not.toBeInTheDocument();
	});

	it("renders both filled and unfilled stars for partial impressions", async () => {
		const { container } = await render(
			<SessionSummaryCard
				session={{
					id: "session-6",
					name: "Mixed Rating Day",
					startTime: new Date("2026-04-01T08:00:00.000Z"),
					endTime: new Date("2026-04-01T08:30:00.000Z"),
					impression: 3,
					notes: null,
					setGroups: [],
				}}
			/>,
		);

		expect(container.querySelectorAll(".fill-amber-400")).toHaveLength(3);
		expect(container.querySelectorAll(".text-muted\\/40")).toHaveLength(2);
	});
});
