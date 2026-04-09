import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleEnum } from "@/db/schema/user-data";
import { DeleteExerciseModal } from "./delete-exercise-modal";
import { DeleteLookupModal } from "./delete-lookup-modal";
import { LookupFormModal } from "./lookup-form-modal";
import { UserRoleModal } from "./user-role-modal";

const mockUpdateUserRole = vi.fn();
let selectOnValueChange: ((value: string) => void) | undefined;

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
	Select: ({
		children,
		onValueChange,
	}: {
		children: React.ReactNode;
		onValueChange: (value: string) => void;
	}) => {
		selectOnValueChange = onValueChange;
		return <div>{children}</div>;
	},
	SelectContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({
		children,
		value,
	}: {
		children: React.ReactNode;
		value: string;
	}) => (
		<button type="button" onClick={() => selectOnValueChange?.(value)}>
			{children}
		</button>
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
		selectOnValueChange = undefined;
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

	it("shows lookup form edit text, pending state, and fallback errors", async () => {
		const onSubmit = vi.fn().mockRejectedValue("lookup failed");
		const onClose = vi.fn();

		render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={{ id: "equipment-1", name: "Barbell" }}
				onSubmit={onSubmit}
				isPending={true}
			/>,
		);

		expect(screen.getByText("Edit Equipment")).toBeInTheDocument();
		expect(screen.getByText("Update the equipment name")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("surfaces lookup submission errors and keeps the modal open", async () => {
		const onSubmit = vi.fn().mockRejectedValue("lookup failed");
		const onClose = vi.fn();

		render(
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
			target: { value: "Rope" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(
			await screen.findByText("Failed to create equipment"),
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("validates lookup names before submitting", () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onClose = vi.fn();

		render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(screen.getByText("Equipment name is required")).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("falls back to a generic lookup error for non-error rejections", async () => {
		const onSubmit = vi.fn().mockRejectedValueOnce("lookup failed");

		render(
			<LookupFormModal
				open
				onClose={vi.fn()}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Name"), {
			target: { value: "Rope" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(
			await screen.findByText("Failed to create equipment"),
		).toBeInTheDocument();
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

	it("falls back to a generic delete lookup error for non-error rejections", async () => {
		const lookupDelete = vi.fn().mockRejectedValueOnce("lookup failed");

		render(
			<DeleteLookupModal
				item={{ id: "lookup-1", name: "Rope" }}
				title="Equipment"
				onClose={vi.fn()}
				onDelete={lookupDelete}
				isPending={false}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		expect(
			await screen.findByText("Failed to delete equipment"),
		).toBeInTheDocument();
	});

	it("shows delete lookup pending state", () => {
		render(
			<DeleteLookupModal
				item={{ id: "lookup-1", name: "Rope" }}
				title="Equipment"
				onClose={vi.fn()}
				onDelete={vi.fn()}
				isPending={true}
			/>,
		);

		expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
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

	it("falls back to a generic exercise delete error for non-error throws", () => {
		const exerciseClose = vi.fn();
		const exerciseDelete = vi.fn(() => {
			throw "exercise failed";
		});

		render(
			<DeleteExerciseModal
				exercise={{ id: "exercise-1", name: "Bench Press" }}
				onClose={exerciseClose}
				onDelete={exerciseDelete}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(screen.getByText("Failed to delete exercise")).toBeInTheDocument();
		expect(exerciseClose).not.toHaveBeenCalled();
	});

	it("keeps the user role selection guard from accepting invalid values", () => {
		const onClose = vi.fn();

		render(
			<UserRoleModal
				user={{
					id: "user-1",
					userId: "user-1",
					email: "coach@example.com",
					role: RoleEnum.USER,
				}}
				onClose={onClose}
			/>,
		);

		selectOnValueChange?.("SUPERADMIN");

		expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
		expect(
			screen.getByText("Users can only manage their own data"),
		).toBeInTheDocument();
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

	it("changes the user role, submits the update, and closes on success", async () => {
		const onClose = vi.fn();

		render(
			<UserRoleModal
				user={{
					id: "user-1",
					userId: "user-1",
					email: "coach@example.com",
					role: RoleEnum.USER,
				}}
				onClose={onClose}
			/>,
		);

		expect(
			screen.getByText("Users can only manage their own data"),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();

		fireEvent.click(screen.getByRole("button", { name: "Admin" }));
		expect(
			screen.getByText("Admins can manage all global data and users"),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();

		fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
		await waitFor(() => {
			expect(mockUpdateUserRole).toHaveBeenCalledWith({
				id: "user-1",
				role: RoleEnum.ADMIN,
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("shows user role update failures and keeps the modal open", async () => {
		mockUpdateUserRole.mockRejectedValueOnce(new Error("role failed"));
		const onClose = vi.fn();

		render(
			<UserRoleModal
				user={{
					id: "user-1",
					userId: "user-1",
					email: "coach@example.com",
					role: RoleEnum.USER,
				}}
				onClose={onClose}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Admin" }));
		fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		expect(await screen.findByText("role failed")).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
