import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkoutSetGroup } from "@/lib/types";
import { DeleteSetGroupModal } from "./delete-set-group-modal";

const mockDeleteSetGroup = vi.fn();

vi.mock("@/hooks", () => ({
	useDeleteSetGroup: () => ({
		mutateAsync: mockDeleteSetGroup,
	}),
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

		render(<DeleteSetGroupModal open onClose={onClose} setGroup={setGroup} />);

		fireEvent.click(screen.getByRole("button", { name: "Yes" }));

		await waitFor(() => {
			expect(mockDeleteSetGroup).toHaveBeenCalledWith("set-group-1");
			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("closes without deleting when No is clicked", () => {
		const onClose = vi.fn();

		render(
			<DeleteSetGroupModal
				open
				onClose={onClose}
				setGroup={{ id: "set-group-1" } as WorkoutSetGroup}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "No" }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(mockDeleteSetGroup).not.toHaveBeenCalled();
	});

	it("closes from the dialog close button", () => {
		const onClose = vi.fn();

		render(
			<DeleteSetGroupModal
				open
				onClose={onClose}
				setGroup={{ id: "set-group-1" } as WorkoutSetGroup}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Close" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
