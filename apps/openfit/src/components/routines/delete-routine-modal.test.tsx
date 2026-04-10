import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { DeleteRoutineModal } from "./delete-routine-modal";

const mockDeleteRoutine = vi.fn();

vi.mock("@/hooks", () => ({
	useDeleteRoutine: () => ({
		mutateAsync: mockDeleteRoutine,
	}),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({
		children,
		open,
		onOpenChange,
	}: {
		children: ReactNode;
		open: boolean;
		onOpenChange?: (open: boolean) => void;
	}) =>
		open ? (
			<div>
				{children}
				<button type="button" onClick={() => onOpenChange?.(true)}>
					Stay open
				</button>
				<button type="button" onClick={() => onOpenChange?.(false)}>
					Close dialog
				</button>
			</div>
		) : null,
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

describe("DeleteRoutineModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDeleteRoutine.mockResolvedValue({});
	});

	it("deletes the routine and closes once the mutation resolves", async () => {
		let resolveDelete: () => void;
		mockDeleteRoutine.mockReturnValue(
			new Promise<void>((resolve) => {
				resolveDelete = resolve;
			}),
		);

		const onClose = vi.fn();

		const screen = await render(
			<DeleteRoutineModal open onClose={onClose} routineId="routine-1" />,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Delete Routine" }),
		);
		await expect
			.element(screen.getByRole("button", { name: "Deleting..." }))
			.toBeDisabled();

		if (!resolveDelete) {
			throw new Error("delete resolver was not created");
		}
		resolveDelete();
		await vi.waitFor(() => {
			expect(mockDeleteRoutine).toHaveBeenCalledWith("routine-1");
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("cancels from the footer action", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteRoutineModal open onClose={onClose} routineId="routine-1" />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("closes from the dialog close button", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteRoutineModal open onClose={onClose} routineId="routine-1" />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("keeps the dialog open when the open flag stays true", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteRoutineModal open onClose={onClose} routineId="routine-1" />,
		);

		await expect
			.element(screen.getByRole("button", { name: "Delete Routine" }))
			.toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("does not close when the dialog reports staying open", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteRoutineModal open onClose={onClose} routineId="routine-1" />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Stay open" }));
		expect(onClose).not.toHaveBeenCalled();
	});
});
