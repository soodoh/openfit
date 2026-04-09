import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteDayModal } from "./delete-day-modal";

const mockDeleteRoutineDay = vi.fn();

vi.mock("@/hooks", () => ({
	useDeleteRoutineDay: () => ({
		mutateAsync: mockDeleteRoutineDay,
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

describe("DeleteDayModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDeleteRoutineDay.mockResolvedValue({});
	});

	it("deletes the day, notifies callbacks, and shows the pending state", async () => {
		let resolveDelete: () => void;
		mockDeleteRoutineDay.mockReturnValue(
			new Promise<void>((resolve) => {
				resolveDelete = resolve;
			}),
		);

		const onClose = vi.fn();
		const onSuccess = vi.fn();

		render(
			<DeleteDayModal
				open
				onClose={onClose}
				dayId="day-1"
				onSuccess={onSuccess}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete Day" }));
		expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();

		if (!resolveDelete) {
			throw new Error("delete resolver was not created");
		}
		resolveDelete();
		await waitFor(() => {
			expect(onClose).toHaveBeenCalledTimes(1);
			expect(onSuccess).toHaveBeenCalledTimes(1);
		});
	});

	it("closes from the cancel action", () => {
		const onClose = vi.fn();

		render(<DeleteDayModal open onClose={onClose} dayId="day-1" />);

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("closes from the dialog close button", () => {
		const onClose = vi.fn();

		render(<DeleteDayModal open onClose={onClose} dayId="day-1" />);

		fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not close when the dialog reports staying open", () => {
		const onClose = vi.fn();

		render(<DeleteDayModal open onClose={onClose} dayId="day-1" />);

		fireEvent.click(screen.getByRole("button", { name: "Stay open" }));
		expect(onClose).not.toHaveBeenCalled();
	});
});
