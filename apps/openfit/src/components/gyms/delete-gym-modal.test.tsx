import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { DeleteGymModal } from "./delete-gym-modal";

const mockDeleteGym = vi.fn();

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		disabled,
		onClick,
		type,
	}: {
		children: ReactNode;
		disabled?: boolean;
		onClick?: () => void;
		type?: "button" | "submit";
		variant?: string;
	}) => (
		<button type={type ?? "button"} disabled={disabled} onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
		open ? <div>{children}</div> : null,
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

vi.mock("@/hooks", () => ({
	useDeleteGym: () => ({
		mutateAsync: mockDeleteGym,
	}),
}));

describe("DeleteGymModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDeleteGym.mockResolvedValue(undefined);
	});

	it("shows the last-gym warning instead of a destructive action", async () => {
		const screen = await render(
			<DeleteGymModal
				gym={{ id: "gym-1", name: "Home Gym", equipmentIds: [] }}
				isLastGym
				onClose={vi.fn()}
			/>,
		);

		await expect
			.element(
				screen.getByText(
					"You cannot delete your only gym. Create another gym first.",
				),
			)
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Delete Gym" }))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Close" }))
			.toBeInTheDocument();
	});

	it("maps delete failures to a user-friendly error", async () => {
		mockDeleteGym.mockRejectedValueOnce(
			new Error("last gym cannot be deleted"),
		);
		const onClose = vi.fn();

		const screen = await render(
			<DeleteGymModal
				gym={{ id: "gym-1", name: "Home Gym", equipmentIds: [] }}
				onClose={onClose}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete Gym" }));

		await expect
			.element(
				screen.getByText(
					"You cannot delete your only gym. Create another gym first.",
				),
			)
			.toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
