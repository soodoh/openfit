import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteDayModal } from "./delete-day-modal";

const mockDeleteRoutineDay = vi.fn();

vi.mock("@/hooks", () => ({
	useDeleteRoutineDay: () => ({
		mutateAsync: mockDeleteRoutineDay,
	}),
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
});
