import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
	it("opens the default routine modal from the primary action", async () => {
		const screen = await render(<CreateRoutine />);

		await userEvent.click(screen.getByRole("button", { name: "New Routine" }));

		await expect
			.element(screen.getByRole("dialog"))
			.toHaveTextContent("Edit Routine Modal");
	});

	it("closes the default routine modal from its footer action", async () => {
		const screen = await render(<CreateRoutine />);

		await userEvent.click(screen.getByRole("button", { name: "New Routine" }));
		await userEvent.click(screen.getByRole("button", { name: "Close modal" }));

		await expect.element(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("uses the empty-state variant label and closes the modal", async () => {
		const screen = await render(<CreateRoutine variant="empty-state" />);

		await userEvent.click(
			screen.getByRole("button", { name: "Create Your First Routine" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Close modal" }));

		await expect.element(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
