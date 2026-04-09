import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleEnum } from "@/db/schema/user-data";
import { DeleteExerciseModal } from "./delete-exercise-modal";
import { DeleteLookupModal } from "./delete-lookup-modal";
import { LookupFormModal } from "./lookup-form-modal";
import { UserRoleModal } from "./user-role-modal";

const mockUpdateUserRole = vi.fn();

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: React.ReactNode }) => (
		<p>{children}</p>
	),
	DialogFooter: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<h2>{children}</h2>
	),
}));

vi.mock("@/components/ui/select", () => ({
	Select: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectTrigger: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectValue: () => null,
}));

vi.mock("@/hooks", () => ({
	useUpdateUserRole: () => ({
		mutateAsync: mockUpdateUserRole,
	}),
}));

describe("admin modals and form state", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateUserRole.mockResolvedValue(undefined);
	});

	it("trims lookup names and resets the input when a different item opens", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onClose = vi.fn();
		const { rerender } = render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Name"), {
			target: { value: "  Kettlebell  " },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith("Kettlebell");
		});

		rerender(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={{ id: "equipment-1", name: "Barbell" }}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		expect(screen.getByLabelText("Name")).toHaveValue("Barbell");
	});

	it("shows delete lookup errors while preserving the open state", async () => {
		const lookupClose = vi.fn();
		const lookupDelete = vi
			.fn()
			.mockRejectedValueOnce(new Error("lookup failed"));

		render(
			<DeleteLookupModal
				item={{ id: "lookup-1", name: "Rope" }}
				title="Equipment"
				onClose={lookupClose}
				onDelete={lookupDelete}
				isPending={false}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(await screen.findByText("lookup failed")).toBeInTheDocument();
		expect(lookupClose).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(lookupClose).toHaveBeenCalledTimes(1);
	});

	it("shows delete exercise errors while preserving the open state", () => {
		const exerciseClose = vi.fn();
		const exerciseDelete = vi.fn(() => {
			throw new Error("exercise failed");
		});

		render(
			<DeleteExerciseModal
				exercise={{ id: "exercise-1", name: "Bench Press" }}
				onClose={exerciseClose}
				onDelete={exerciseDelete}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(screen.getByText("exercise failed")).toBeInTheDocument();
		expect(exerciseClose).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(exerciseClose).toHaveBeenCalledTimes(1);
	});

	it("keeps the user role save button disabled until the role changes", () => {
		const onClose = vi.fn();

		render(
			<UserRoleModal
				user={{
					id: "user-1",
					userId: "user-1",
					email: "coach@example.com",
					role: RoleEnum.ADMIN,
				}}
				onClose={onClose}
			/>,
		);

		expect(
			screen.getByText("Admins can manage all global data and users"),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
