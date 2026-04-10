import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { WorkoutSetGroup } from "@/lib/types";
import { DeleteSetGroupModal } from "./delete-set-group-modal";

const mockDeleteSetGroup = vi.fn();

vi.mock("@/hooks", () => ({
	useDeleteSetGroup: () => ({
		mutateAsync: mockDeleteSetGroup,
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

describe("DeleteSetGroupModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("deletes the set group and closes the dialog", async () => {
		mockDeleteSetGroup.mockResolvedValue({});
		const onClose = vi.fn();
		const setGroup = {
			id: "set-group-1",
		} as WorkoutSetGroup;

		const screen = await render(
			<DeleteSetGroupModal open onClose={onClose} setGroup={setGroup} />,
		);

		await userEvent.click(screen.getByRole("button", { name: "Yes" }));

		await vi.waitFor(() => {
			expect(mockDeleteSetGroup).toHaveBeenCalledWith("set-group-1");
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("closes without deleting when No is clicked", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteSetGroupModal
				open
				onClose={onClose}
				setGroup={{ id: "set-group-1" } as WorkoutSetGroup}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "No" }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(mockDeleteSetGroup).not.toHaveBeenCalled();
	});

	it("closes from the dialog close button", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteSetGroupModal
				open
				onClose={onClose}
				setGroup={{ id: "set-group-1" } as WorkoutSetGroup}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("keeps the dialog open when no close event is dispatched", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteSetGroupModal
				open
				onClose={onClose}
				setGroup={{ id: "set-group-1" } as WorkoutSetGroup}
			/>,
		);

		await expect
			.element(screen.getByRole("button", { name: "Yes" }))
			.toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("does not close when the dialog reports staying open", async () => {
		const onClose = vi.fn();

		const screen = await render(
			<DeleteSetGroupModal
				open
				onClose={onClose}
				setGroup={{ id: "set-group-1" } as WorkoutSetGroup}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Stay open" }));
		expect(onClose).not.toHaveBeenCalled();
	});
});
