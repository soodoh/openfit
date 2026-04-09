import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RoutineWithDays } from "@/lib/types";
import { RoutineCard } from "./routine-card";

vi.mock("dayjs", () => {
	const dayjsMock = () => ({
		fromNow: () => "just now",
	});

	dayjsMock.extend = vi.fn();
	return { default: dayjsMock };
});

vi.mock("./routine-modal", () => ({
	RoutineModal: ({ open }: { open: boolean }) =>
		open ? <div role="dialog">Routine modal body</div> : null,
}));

const routine = {
	id: "routine-1",
	userId: "user-1",
	name: "Strength Plan",
	description: undefined,
	createdAt: new Date("2026-03-01T00:00:00.000Z"),
	updatedAt: new Date("2026-03-02T00:00:00.000Z"),
	routineDays: [
		{
			id: "day-1",
			routineId: "routine-1",
			userId: "user-1",
			description: "Pull Day",
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-01T00:00:00.000Z"),
			weekdays: [1, 3],
		},
	],
} as RoutineWithDays;

describe("RoutineCard", () => {
	it("opens the routine modal when the card is clicked", () => {
		render(<RoutineCard routine={routine} currentSession={undefined} />);

		expect(screen.getByText("1 day")).toBeInTheDocument();
		expect(screen.getByText("Updated just now")).toBeInTheDocument();
		expect(screen.queryByText("Pull Day")).not.toBeInTheDocument();

		fireEvent.click(screen.getByText("Strength Plan"));

		expect(screen.getByRole("dialog")).toHaveTextContent("Routine modal body");
	});
});
