import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
		render(<AddExerciseRow sessionOrDayId="day-1" isSession={false} />);

		expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();

		fireEvent.click(screen.getByRole("button", { name: "Select Exercise" }));
		fireEvent.change(screen.getByPlaceholderText("Sets"), {
			target: { value: "4" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Add" }));

		await waitFor(() => {
			expect(mockCreateSetGroup).toHaveBeenCalledWith({
				sessionId: undefined,
				routineDayId: "day-1",
				type: "NORMAL",
				exerciseId: "exercise-1",
				numSets: 4,
			});
		});

		expect(screen.getByText("No exercise selected")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Sets")).toHaveValue(1);
	});

	it("targets the session id when adding an exercise during a workout session", async () => {
		render(<AddExerciseRow sessionOrDayId="session-1" isSession />);

		fireEvent.click(screen.getByRole("button", { name: "Select Exercise" }));
		fireEvent.click(screen.getByRole("button", { name: "Add" }));

		await waitFor(() => {
			expect(mockCreateSetGroup).toHaveBeenCalledWith({
				sessionId: "session-1",
				routineDayId: undefined,
				type: "NORMAL",
				exerciseId: "exercise-1",
				numSets: 1,
			});
		});
	});
});
