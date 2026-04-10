import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { Units, WorkoutSessionWithData } from "@/lib/types";
import { CurrentSessionPage } from "./current-session-page";

const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
		<a href={to} {...props} rel="noreferrer">
			{children}
		</a>
	),
	useNavigate: () => mockNavigate,
}));
vi.mock("@/hooks", () => ({
	useUpdateSession: () => ({
		mutateAsync: mockMutateAsync,
		isPending: false,
	}),
}));
vi.mock("@/components/workoutSet/workout-list", () => ({
	WorkoutList: () => <div data-testid="workout-list" />,
}));
vi.mock("./current-duration", () => ({
	CurrentDuration: () => <div data-testid="current-duration" />,
}));
vi.mock("./edit-session-menu", () => ({
	EditSessionMenu: () => <div data-testid="edit-session-menu" />,
}));
const mockSession = {
	id: "session-1",
	userId: "user-1",
	name: "Leg Day",
	notes: "",
	impression: null,
	startTime: new Date("2026-02-19T10:00:00.000Z"),
	endTime: null,
	templateId: null,
	createdAt: new Date("2026-02-19T10:00:00.000Z"),
	updatedAt: new Date("2026-02-19T10:00:00.000Z"),
	setGroups: [],
} satisfies WorkoutSessionWithData;
const mockUnits: Units = {
	repetitionUnits: [],
	weightUnits: [],
};
describe("CurrentSessionPage end session confirmation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockMutateAsync.mockResolvedValue({});
	});

	it("opens a confirmation dialog and does nothing when canceled", async () => {
		const screen = await render(
			<CurrentSessionPage session={mockSession} units={mockUnits} />,
		);
		await userEvent.click(screen.getByRole("button", { name: "End Session" }));
		await expect.element(screen.getByText("End Session?")).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "No" }));
		expect(mockMutateAsync).not.toHaveBeenCalled();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("ends the session and navigates to logs after confirmation", async () => {
		const screen = await render(
			<CurrentSessionPage session={mockSession} units={mockUnits} />,
		);
		await userEvent.click(screen.getByRole("button", { name: "End Session" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Yes, End Session" }),
		);
		await vi.waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledTimes(1);
		});
		const [payload] = mockMutateAsync.mock.calls[0];
		expect(payload.id).toBe(mockSession.id);
		expect(typeof payload.endTime).toBe("number");
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/logs" });
	});

	it("renders fallback title, notes, and computed progress stats", async () => {
		const sessionWithProgress = {
			...mockSession,
			name: "",
			notes: "Keep elbows tucked",
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
						{
							id: "set-2",
							userId: "user-1",
							setGroupId: "group-1",
							exerciseId: "exercise-1",
							type: "NORMAL",
							order: 1,
							reps: 8,
							repetitionUnitId: "rep",
							weight: 135,
							weightUnitId: "weight",
							restTime: 90,
							completed: false,
							exercise: { id: "exercise-1", name: "Bench", imageUrl: null },
							repetitionUnit: { id: "rep", name: "Reps" },
							weightUnit: { id: "weight", name: "lb" },
						},
						{
							id: "set-3",
							userId: "user-1",
							setGroupId: "group-1",
							exerciseId: "exercise-1",
							type: "NORMAL",
							order: 2,
							reps: 8,
							repetitionUnitId: "rep",
							weight: 135,
							weightUnitId: "weight",
							restTime: 90,
							completed: false,
							exercise: { id: "exercise-1", name: "Bench", imageUrl: null },
							repetitionUnit: { id: "rep", name: "Reps" },
							weightUnit: { id: "weight", name: "lb" },
						},
					],
				},
			],
		} satisfies WorkoutSessionWithData;

		const screen = await render(
			<CurrentSessionPage session={sessionWithProgress} units={mockUnits} />,
		);

		await expect
			.element(screen.getByRole("heading", { name: "Workout Session" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Keep elbows tucked"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("33%")).toBeInTheDocument();
		await expect.element(screen.getByText("1 / 3 sets")).toBeInTheDocument();
	});
});
