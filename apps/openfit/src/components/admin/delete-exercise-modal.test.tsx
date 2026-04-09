import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { DeleteExerciseModal } from "./delete-exercise-modal";

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<p>{children}</p>
	),
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

describe("DeleteExerciseModal", () => {
	it("ignores delete clicks when no exercise is selected", () => {
		const onClose = vi.fn();
		const onDelete = vi.fn();

		render(
			<DeleteExerciseModal
				exercise={undefined}
				onClose={onClose}
				onDelete={onDelete}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		expect(onDelete).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("shows the pending state while awaiting an async delete", async () => {
		const onClose = vi.fn();
		const onDelete = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					setTimeout(resolve, 0);
				}),
		);

		render(
			<DeleteExerciseModal
				exercise={{ id: "exercise-1", name: "Bench Press" }}
				onClose={onClose}
				onDelete={onDelete}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();

		await waitFor(() => {
			expect(onDelete).toHaveBeenCalledWith("exercise-1");
		});

		await waitFor(() => {
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});
});
