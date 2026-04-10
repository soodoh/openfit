import { userEvent } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { RoutineWithDays } from "@/lib/types";
import { RoutineCard } from "./routine-card";

// Use fake timers pinned just after the routine's updatedAt so fromNow() returns "just now"
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-03-02T00:00:01.000Z"));
});
afterEach(() => {
	vi.useRealTimers();
});

vi.mock("./routine-modal", () => ({
	RoutineModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
		open ? (
			<div role="dialog">
				Routine modal body
				<button type="button" onClick={onClose}>
					Close routine modal
				</button>
			</div>
		) : null,
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
	it("opens the routine modal when the card is clicked", async () => {
		const screen = await render(
			<RoutineCard routine={routine} currentSession={undefined} />,
		);

		await expect.element(screen.getByText("1 day")).toBeInTheDocument();
		await expect
			.element(screen.getByText(/Updated .+ ago|Updated in .+/))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Pull Day")).not.toBeInTheDocument();

		await userEvent.click(screen.getByText("Strength Plan"));

		await expect
			.element(screen.getByRole("dialog"))
			.toHaveTextContent("Routine modal body");
		await userEvent.click(
			screen.getByRole("button", { name: "Close routine modal" }),
		);
		await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders the routine description and plural day label", async () => {
		const pluralRoutine = {
			...routine,
			description: "Upper and lower body split",
			routineDays: [
				...routine.routineDays,
				{
					...routine.routineDays[0],
					id: "day-2",
					description: "Push Day",
				},
			],
		} as RoutineWithDays;

		const screen = await render(
			<RoutineCard routine={pluralRoutine} currentSession={undefined} />,
		);

		await expect
			.element(screen.getByText("Upper and lower body split"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("2 days")).toBeInTheDocument();
	});
});
