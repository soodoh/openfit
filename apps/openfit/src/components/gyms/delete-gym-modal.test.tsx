import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

	it("shows the last-gym warning instead of a destructive action", () => {
		render(
			<DeleteGymModal
				gym={{ id: "gym-1", name: "Home Gym", equipmentIds: [] }}
				isLastGym
				onClose={vi.fn()}
			/>,
		);

		expect(
			screen.getByText(
				"You cannot delete your only gym. Create another gym first.",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Delete Gym" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
	});

	it("maps delete failures to a user-friendly error", async () => {
		mockDeleteGym.mockRejectedValueOnce(
			new Error("last gym cannot be deleted"),
		);
		const onClose = vi.fn();

		render(
			<DeleteGymModal
				gym={{ id: "gym-1", name: "Home Gym", equipmentIds: [] }}
				onClose={onClose}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete Gym" }));

		expect(
			await screen.findByText(
				"You cannot delete your only gym. Create another gym first.",
			),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
