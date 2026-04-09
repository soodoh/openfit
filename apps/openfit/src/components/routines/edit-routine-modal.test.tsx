import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Routine } from "@/lib/types";
import { EditRoutineModal } from "./edit-routine-modal";

const mockCreateRoutine = vi.fn();
const mockUpdateRoutine = vi.fn();

vi.mock("@/hooks", () => ({
	useCreateRoutine: () => ({
		mutateAsync: mockCreateRoutine,
	}),
	useUpdateRoutine: () => ({
		mutateAsync: mockUpdateRoutine,
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

vi.mock("@/components/ui/label", () => ({
	Label: ({
		children,
		...props
	}: React.LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) => (
		<label htmlFor={props.htmlFor} {...props}>
			{children}
		</label>
	),
}));

describe("EditRoutineModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateRoutine.mockResolvedValue({});
		mockUpdateRoutine.mockResolvedValue({});
	});

	it("creates a routine and closes the dialog on success", async () => {
		const onClose = vi.fn();

		render(<EditRoutineModal open onClose={onClose} />);

		fireEvent.change(screen.getByLabelText("Routine Name"), {
			target: { value: "Push Pull Legs" },
		});
		fireEvent.change(screen.getByLabelText(/Description/), {
			target: { value: "Three day split" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create Routine" }));

		await waitFor(() => {
			expect(mockCreateRoutine).toHaveBeenCalledWith({
				name: "Push Pull Legs",
				description: "Three day split",
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("shows a save error when the mutation fails", async () => {
		mockCreateRoutine.mockRejectedValueOnce(new Error("boom"));

		render(<EditRoutineModal open onClose={vi.fn()} />);

		fireEvent.change(screen.getByLabelText("Routine Name"), {
			target: { value: "Push Pull Legs" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create Routine" }));

		await waitFor(() => {
			expect(screen.getByText("Failed to save routine")).toBeInTheDocument();
		});
	});

	it("updates an existing routine with the save changes label", async () => {
		const onClose = vi.fn();
		const routine = {
			id: "routine-1",
			userId: "user-1",
			name: "Upper Lower",
			description: "Existing description",
			createdAt: new Date("2026-03-01T00:00:00.000Z"),
			updatedAt: new Date("2026-03-01T00:00:00.000Z"),
			routineDays: [],
		} as Routine;

		render(<EditRoutineModal open onClose={onClose} routine={routine} />);

		expect(
			screen.getByRole("button", { name: "Save Changes" }),
		).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Routine Name"), {
			target: { value: "Upper Lower 2" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await waitFor(() => {
			expect(mockUpdateRoutine).toHaveBeenCalledWith({
				id: "routine-1",
				name: "Upper Lower 2",
				description: "Existing description",
			});
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});
});
