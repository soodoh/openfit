import { page } from "@vitest/browser/context";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	it("renders the session summary, duration, and workout list", async () => {
		const screen = await render(
			<SessionPage session={session} units={units} />,
		);

		await expect
			.element(screen.getByRole("link", { name: "Back to Logs" }))
			.toHaveAttribute("href", "/logs");
		await expect
			.element(screen.getByRole("heading", { name: "Upper Body" }))
			.toBeInTheDocument();
		await expect.element(screen.getByText("April 8, 2026")).toBeInTheDocument();
		await expect.element(screen.getByText("2h 30m")).toBeInTheDocument();
		await expect
			.element(
				page.elementLocator(
					screen.getByText("Total Sets").element().parentElement as Element,
				),
			)
			.toHaveTextContent("1");
		await expect.element(screen.getByText("—").first()).toBeInTheDocument();
		await expect
			.element(screen.getByTestId("edit-session-menu"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("workout-list"))
			.toHaveTextContent("session-1:1");
	});

	it("renders notes and rating details when they are present", async () => {
		const screen = await render(
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

		await expect.element(screen.getByText("Felt strong")).toBeInTheDocument();
		await expect.element(screen.getByText("Rating")).toBeInTheDocument();
	});

	it("shows a dash when the session has no end time", async () => {
		const screen = await render(
			<SessionPage
				session={{
					...session,
					endTime: null,
					notes: null,
					impression: null,
				}}
				units={units}
			/>,
		);

		await expect
			.element(
				page.elementLocator(
					screen.getByText("Duration").element().parentElement as Element,
				),
			)
			.toHaveTextContent("—");
		await expect
			.element(
				page.elementLocator(
					screen.getByText("Notes").element().parentElement as Element,
				),
			)
			.toHaveTextContent("—");
	});

	it("formats shorter sessions in minutes", async () => {
		const screen = await render(
			<SessionPage
				session={{
					...session,
					endTime: new Date("2026-04-08T09:15:00.000Z"),
				}}
				units={units}
			/>,
		);

		await expect.element(screen.getByText("15 min")).toBeInTheDocument();
	});
});
