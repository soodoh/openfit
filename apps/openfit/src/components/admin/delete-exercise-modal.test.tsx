import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
	it("ignores delete clicks when no exercise is selected", async () => {
		const onClose = vi.fn();
		const onDelete = vi.fn();

		const screen = await render(
			<DeleteExerciseModal
				exercise={undefined}
				onClose={onClose}
				onDelete={onDelete}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));

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

		const screen = await render(
			<DeleteExerciseModal
				exercise={{ id: "exercise-1", name: "Bench Press" }}
				onClose={onClose}
				onDelete={onDelete}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));

		await expect
			.element(screen.getByRole("button", { name: "Deleting..." }))
			.toBeDisabled();

		await vi.waitFor(() => {
			expect(onDelete).toHaveBeenCalledWith("exercise-1");
		});

		await vi.waitFor(() => {
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});
});
