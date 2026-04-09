import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CreateRoutine } from "./create-routine";

vi.mock("./edit-routine-modal", () => ({
	EditRoutineModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div role="dialog">
				<div>Edit Routine Modal</div>
				<button type="button" onClick={onClose}>
					Close modal
				</button>
			</div>
		) : null,
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
		children: ReactNode;
	}) => <button {...props}>{children}</button>,
}));

describe("CreateRoutine", () => {
	it("opens the default routine modal from the primary action", () => {
		render(<CreateRoutine />);

		fireEvent.click(screen.getByRole("button", { name: "New Routine" }));

		expect(screen.getByRole("dialog")).toHaveTextContent("Edit Routine Modal");
	});

	it("uses the empty-state variant label and closes the modal", () => {
		render(<CreateRoutine variant="empty-state" />);

		fireEvent.click(
			screen.getByRole("button", { name: "Create Your First Routine" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Close modal" }));

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
