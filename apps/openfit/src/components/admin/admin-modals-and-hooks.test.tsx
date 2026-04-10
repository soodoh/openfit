import { userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { RoleEnum } from "@/db/schema/user-data";
import { DeleteExerciseModal } from "./delete-exercise-modal";
import { DeleteLookupModal } from "./delete-lookup-modal";
import { LookupFormModal } from "./lookup-form-modal";
import { UserRoleModal } from "./user-role-modal";

const mockUpdateUserRole = vi.fn();
let selectOnValueChange: ((value: string) => void) | undefined;

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({
		open,
		children,
		onOpenChange,
	}: {
		open: boolean;
		children: React.ReactNode;
		onOpenChange?: (open: boolean) => void;
	}) =>
		open ? (
			<div>
				{children}
				{onOpenChange ? (
					<button type="button" onClick={() => onOpenChange(false)}>
						Close via open change
					</button>
				) : null}
			</div>
		) : null,
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
		const screen = await render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await screen.getByLabelText("Name").fill("  Kettlebell  ");
		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await vi.waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith("Kettlebell");
		});

		await screen.rerender(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={{ id: "equipment-1", name: "Barbell" }}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await expect.element(screen.getByLabelText("Name")).toHaveValue("Barbell");
	});

	it("shows lookup form edit text, pending state, and fallback errors", async () => {
		const onSubmit = vi.fn().mockRejectedValue("lookup failed");
		const onClose = vi.fn();

		const screen = await render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={{ id: "equipment-1", name: "Barbell" }}
				onSubmit={onSubmit}
				isPending={true}
			/>,
		);

		await expect
			.element(screen.getByText("Edit Equipment"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Update the equipment name"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Saving..." }))
			.toBeDisabled();

		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("surfaces lookup submission errors and keeps the modal open", async () => {
		const onSubmit = vi.fn().mockRejectedValue("lookup failed");
		const onClose = vi.fn();

		const screen = await render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await screen.getByLabelText("Name").fill("Rope");
		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect
			.element(screen.getByText("Failed to create equipment"))
			.toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("surfaces lookup submission Error instances and keeps the modal open", async () => {
		const onSubmit = vi.fn().mockRejectedValue(new Error("lookup failed"));
		const onClose = vi.fn();

		const screen = await render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await screen.getByLabelText("Name").fill("Rope");
		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect.element(screen.getByText("lookup failed")).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("closes the lookup modal through the dialog open-change callback", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onClose = vi.fn();

		const screen = await render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Close via open change" }),
		);

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("leaves a closed lookup modal untouched until it opens", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onClose = vi.fn();
		const screen = await render(
			<LookupFormModal
				open={false}
				onClose={onClose}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await expect.element(screen.getByText("Name")).not.toBeInTheDocument();

		await screen.rerender(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={{ id: "equipment-1", name: "Barbell" }}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await expect.element(screen.getByLabelText("Name")).toHaveValue("Barbell");
	});

	it("validates lookup names before submitting", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const onClose = vi.fn();

		const screen = await render(
			<LookupFormModal
				open
				onClose={onClose}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect
			.element(screen.getByText("Equipment name is required"))
			.toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("falls back to a generic lookup error for non-error rejections", async () => {
		const onSubmit = vi.fn().mockRejectedValueOnce("lookup failed");

		const screen = await render(
			<LookupFormModal
				open
				onClose={vi.fn()}
				title="Equipment"
				item={undefined}
				onSubmit={onSubmit}
				isPending={false}
			/>,
		);

		await screen.getByLabelText("Name").fill("Rope");
		await userEvent.click(screen.getByRole("button", { name: "Create" }));

		await expect
			.element(screen.getByText("Failed to create equipment"))
			.toBeInTheDocument();
	});

	it("shows delete lookup errors while preserving the open state", async () => {
		const lookupClose = vi.fn();
		const lookupDelete = vi
			.fn()
			.mockRejectedValueOnce(new Error("lookup failed"));

		const screen = await render(
			<DeleteLookupModal
				item={{ id: "lookup-1", name: "Rope" }}
				title="Equipment"
				onClose={lookupClose}
				onDelete={lookupDelete}
				isPending={false}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));
		await expect.element(screen.getByText("lookup failed")).toBeInTheDocument();
		expect(lookupClose).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(lookupClose).toHaveBeenCalledTimes(1);
	});

	it("falls back to a generic delete lookup error for non-error rejections", async () => {
		const lookupDelete = vi.fn().mockRejectedValueOnce("lookup failed");

		const screen = await render(
			<DeleteLookupModal
				item={{ id: "lookup-1", name: "Rope" }}
				title="Equipment"
				onClose={vi.fn()}
				onDelete={lookupDelete}
				isPending={false}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));

		await expect
			.element(screen.getByText("Failed to delete equipment"))
			.toBeInTheDocument();
	});

	it("shows delete lookup pending state", async () => {
		const screen = await render(
			<DeleteLookupModal
				item={{ id: "lookup-1", name: "Rope" }}
				title="Equipment"
				onClose={vi.fn()}
				onDelete={vi.fn()}
				isPending={true}
			/>,
		);

		await expect
			.element(screen.getByRole("button", { name: "Deleting..." }))
			.toBeDisabled();
	});

	it("shows delete exercise errors while preserving the open state", async () => {
		const exerciseClose = vi.fn();
		const exerciseDelete = vi.fn(() => {
			throw new Error("exercise failed");
		});

		const screen = await render(
			<DeleteExerciseModal
				exercise={{ id: "exercise-1", name: "Bench Press" }}
				onClose={exerciseClose}
				onDelete={exerciseDelete}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));
		await expect
			.element(screen.getByText("exercise failed"))
			.toBeInTheDocument();
		expect(exerciseClose).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(exerciseClose).toHaveBeenCalledTimes(1);
	});

	it("falls back to a generic exercise delete error for non-error throws", async () => {
		const exerciseClose = vi.fn();
		const exerciseDelete = vi.fn(() => {
			throw "exercise failed";
		});

		const screen = await render(
			<DeleteExerciseModal
				exercise={{ id: "exercise-1", name: "Bench Press" }}
				onClose={exerciseClose}
				onDelete={exerciseDelete}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));
		await expect
			.element(screen.getByText("Failed to delete exercise"))
			.toBeInTheDocument();
		expect(exerciseClose).not.toHaveBeenCalled();
	});

	it("keeps the user role selection guard from accepting invalid values", async () => {
		const onClose = vi.fn();

		const screen = await render(
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

		await expect
			.element(screen.getByRole("button", { name: "Save Changes" }))
			.toBeDisabled();
		await expect
			.element(screen.getByText("Users can only manage their own data"))
			.toBeInTheDocument();
	});

	it("keeps the user role save button disabled until the role changes", async () => {
		const onClose = vi.fn();

		const screen = await render(
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

		await expect
			.element(screen.getByText("Admins can manage all global data and users"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Save Changes" }))
			.toBeDisabled();

		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("changes the user role, submits the update, and closes on success", async () => {
		const onClose = vi.fn();

		const screen = await render(
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

		await expect
			.element(screen.getByText("Users can only manage their own data"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Save Changes" }))
			.toBeDisabled();

		await userEvent.click(screen.getByRole("button", { name: "Admin" }));
		await expect
			.element(screen.getByText("Admins can manage all global data and users"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Save Changes" }))
			.toBeEnabled();

		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
		await vi.waitFor(() => {
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

		const screen = await render(
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

		await userEvent.click(screen.getByRole("button", { name: "Admin" }));
		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await expect.element(screen.getByText("role failed")).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
