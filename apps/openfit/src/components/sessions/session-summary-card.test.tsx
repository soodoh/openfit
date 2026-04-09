import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
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
	it("links to the workout view for active sessions and hides the edit menu when requested", () => {
		render(
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

		expect(screen.getByRole("link")).toHaveAttribute("href", "/workout");
		expect(screen.getByText("1h 15m")).toBeInTheDocument();
		expect(screen.getByText("2 sets")).toBeInTheDocument();
		expect(screen.getByText("Strong set")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Edit session menu" }),
		).not.toBeInTheDocument();
	});

	it("links completed sessions to logs and shows the edit menu by default", () => {
		render(
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

		expect(screen.getByRole("link")).toHaveAttribute("href", "/logs");
		expect(
			screen.getByRole("button", { name: "Edit session menu" }),
		).toBeInTheDocument();
		expect(screen.getByText("45 min")).toBeInTheDocument();
	});

	it("renders as a button when an onClick handler is provided", () => {
		const onClick = vi.fn();

		render(
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

		fireEvent.click(screen.getByText("Push Day"));
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
