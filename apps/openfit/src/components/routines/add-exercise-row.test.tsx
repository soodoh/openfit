import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AddExerciseRow } from "./add-exercise-row";

const mockCreateSetGroup = vi.fn();

vi.mock("@/components/exercises/autocomplete-exercise", () => ({
	AutocompleteExercise: ({
		value,
		onChange,
	}: {
		value?: { id: string; name: string };
		onChange: (exercise: { id: string; name: string }) => void;
	}) => (
		<div>
			<div>{value?.name ?? "No exercise selected"}</div>
			<button
				type="button"
				onClick={() => onChange({ id: "exercise-1", name: "Bench Press" })}
			>
				Select Exercise
			</button>
		</div>
	),
}));

vi.mock("@/hooks", () => ({
	useCreateSetGroup: () => ({
		mutateAsync: mockCreateSetGroup,
	}),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
		children: ReactNode;
	}) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
}));

describe("AddExerciseRow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateSetGroup.mockResolvedValue({});
	});

	it("submits the selected exercise with the configured set count and resets the form", async () => {
		const screen = await render(
			<AddExerciseRow sessionOrDayId="day-1" isSession={false} />,
		);

		await expect
			.element(screen.getByRole("button", { name: "Add" }))
			.toBeDisabled();

		await userEvent.click(
			screen.getByRole("button", { name: "Select Exercise" }),
		);
		await screen.getByPlaceholder("Sets").fill("4");
		await userEvent.click(screen.getByRole("button", { name: "Add" }));

		await vi.waitFor(() => {
			expect(mockCreateSetGroup).toHaveBeenCalledWith({
				sessionId: undefined,
				routineDayId: "day-1",
				type: "NORMAL",
				exerciseId: "exercise-1",
				numSets: 4,
			});
		});

		await expect
			.element(screen.getByText("No exercise selected"))
			.toBeInTheDocument();
		await expect.element(screen.getByPlaceholder("Sets")).toHaveValue(1);
	});

	it("targets the session id when adding an exercise during a workout session", async () => {
		const screen = await render(
			<AddExerciseRow sessionOrDayId="session-1" isSession />,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Select Exercise" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Add" }));

		await vi.waitFor(() => {
			expect(mockCreateSetGroup).toHaveBeenCalledWith({
				sessionId: "session-1",
				routineDayId: undefined,
				type: "NORMAL",
				exerciseId: "exercise-1",
				numSets: 1,
			});
		});
	});

	it("does not submit when no exercise has been selected", async () => {
		const screen = await render(
			<AddExerciseRow sessionOrDayId="day-1" isSession={false} />,
		);

		await userEvent.click(
			(screen.container
				.querySelector("form")
				?.querySelector('[type="submit"]') as HTMLElement) ??
				screen.getByRole("button", { name: "Add" }),
		);

		expect(mockCreateSetGroup).not.toHaveBeenCalled();
	});
});
