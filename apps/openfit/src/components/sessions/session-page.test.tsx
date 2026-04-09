import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Units, WorkoutSessionWithData } from "@/lib/types";
import { SessionPage } from "./session-page";

dayjs.extend(duration);

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		...props
	}: {
		children: ReactNode;
		to: string;
		[key: string]: unknown;
	}) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@/components/workoutSet/workout-list", () => ({
	WorkoutList: ({
		sessionOrDayId,
		setGroups,
	}: {
		sessionOrDayId: string;
		setGroups: Array<unknown>;
	}) => (
		<div data-testid="workout-list">
			{sessionOrDayId}:{setGroups.length}
		</div>
	),
}));

vi.mock("./edit-session-menu", () => ({
	EditSessionMenu: () => <div data-testid="edit-session-menu" />,
}));

const units: Units = {
	repetitionUnits: [],
	weightUnits: [],
};

const session = {
	id: "session-1",
	userId: "user-1",
	name: "Upper Body",
	notes: "",
	impression: null,
	startTime: new Date("2026-04-08T09:00:00.000Z"),
	endTime: new Date("2026-04-08T11:30:00.000Z"),
	templateId: null,
	createdAt: new Date("2026-04-08T09:00:00.000Z"),
	updatedAt: new Date("2026-04-08T09:00:00.000Z"),
	setGroups: [
		{
			id: "group-1",
			userId: "user-1",
			routineDayId: null,
			sessionId: "session-1",
			type: "NORMAL",
			order: 0,
			comment: null,
			sets: [
				{
					id: "set-1",
					userId: "user-1",
					setGroupId: "group-1",
					exerciseId: "exercise-1",
					type: "NORMAL",
					order: 0,
					reps: 8,
					repetitionUnitId: "rep",
					weight: 135,
					weightUnitId: "weight",
					restTime: 90,
					completed: true,
					exercise: { id: "exercise-1", name: "Bench", imageUrl: null },
					repetitionUnit: { id: "rep", name: "Reps" },
					weightUnit: { id: "weight", name: "lb" },
				},
			],
		},
	],
} satisfies WorkoutSessionWithData;

describe("SessionPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the session summary, duration, and workout list", () => {
		render(<SessionPage session={session} units={units} />);

		expect(screen.getByRole("link", { name: "Back to Logs" })).toHaveAttribute(
			"href",
			"/logs",
		);
		expect(
			screen.getByRole("heading", { name: "Upper Body" }),
		).toBeInTheDocument();
		expect(screen.getByText("April 8, 2026")).toBeInTheDocument();
		expect(screen.getByText("2h 30m")).toBeInTheDocument();
		expect(screen.getByText("Total Sets").parentElement).toHaveTextContent("1");
		expect(screen.getAllByText("—").length).toBeGreaterThan(0);
		expect(screen.getByTestId("edit-session-menu")).toBeInTheDocument();
		expect(screen.getByTestId("workout-list")).toHaveTextContent("session-1:1");
	});

	it("renders notes and rating details when they are present", () => {
		render(
			<SessionPage
				session={{
					...session,
					name: "Lower Body",
					notes: "Felt strong",
					impression: 5,
				}}
				units={units}
			/>,
		);

		expect(screen.getByText("Felt strong")).toBeInTheDocument();
		expect(screen.getByText("Rating")).toBeInTheDocument();
	});
});
