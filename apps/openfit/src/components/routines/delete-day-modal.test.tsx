import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

		const screen = await render(
			<DeleteDayModal
				open
				onClose={onClose}
				dayId="day-1"
				onSuccess={onSuccess}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete Day" }));
		await expect
			.element(screen.getByRole("button", { name: "Deleting..." }))
			.toBeDisabled();

		if (!resolveDelete) {
			throw new Error("delete resolver was not created");
		}
		resolveDelete();
		await vi.waitFor(() => {
			expect(onClose).toHaveBeenCalledTimes(1);
			expect(onSuccess).toHaveBeenCalledTimes(1);
		});
	});

	it("closes from the cancel action", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteDayModal open onClose={onClose} dayId="day-1" />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("closes from the dialog close button", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteDayModal open onClose={onClose} dayId="day-1" />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("does not close when the dialog reports staying open", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteDayModal open onClose={onClose} dayId="day-1" />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Stay open" }));
		expect(onClose).not.toHaveBeenCalled();
	});
});
