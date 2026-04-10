import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { GymMenu } from "./gym-menu";

const mockSetDefaultGym = vi.fn();

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		type,
		...props
	}: {
		children: ReactNode;
		onClick?: () => void;
		type?: "button" | "submit";
		[key: string]: unknown;
	}) => (
		<button type={type ?? "button"} onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuItem: ({
		children,
		onClick,
	}: {
		children: ReactNode;
		onClick?: () => void;
	}) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
		<>{children}</>
	),
}));

vi.mock("@/hooks", () => ({
	useSetDefaultGym: () => ({
		mutateAsync: mockSetDefaultGym,
	}),
}));

vi.mock("./delete-gym-modal", () => ({
	DeleteGymModal: ({
		gym,
		onClose,
	}: {
		gym?: { name: string };
		onClose: () => void;
	}) =>
		gym ? (
			<div>
				Delete modal for {gym.name}
				<button type="button" onClick={onClose}>
					Close delete modal
				</button>
			</div>
		) : null,
}));

vi.mock("./gym-form-modal", () => ({
	GymFormModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
		open ? (
			<div>
				Edit modal open
				<button type="button" onClick={onClose}>
					Close edit modal
				</button>
			</div>
		) : null,
}));

describe("GymMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows actions, opens the internal modals, and sets the default gym", async () => {
		const screen = await render(
			<GymMenu
				gym={{
					id: "gym-1",
					name: "Home Gym",
					equipmentIds: [],
				}}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Set as Default" }),
		);
		expect(mockSetDefaultGym).toHaveBeenCalledWith("gym-1");

		await userEvent.click(screen.getByRole("button", { name: "Edit" }));
		await expect
			.element(screen.getByText("Edit modal open"))
			.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));
		await expect
			.element(screen.getByText("Delete modal for Home Gym"))
			.toBeInTheDocument();
	});

	it("hides the default action when the gym is already default", async () => {
		const screen = await render(
			<GymMenu
				gym={{
					id: "gym-1",
					name: "Home Gym",
					equipmentIds: [],
				}}
				isDefault
			/>,
		);

		await expect
			.element(screen.getByRole("button", { name: "Set as Default" }))
			.not.toBeInTheDocument();
	});

	it("delegates edit and delete actions to external callbacks when provided", async () => {
		const onEdit = vi.fn();
		const onDelete = vi.fn();

		const screen = await render(
			<GymMenu
				gym={{
					id: "gym-1",
					name: "Home Gym",
					equipmentIds: [],
				}}
				onEdit={onEdit}
				onDelete={onDelete}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Edit" }));
		await userEvent.click(screen.getByRole("button", { name: "Delete" }));

		expect(onEdit).toHaveBeenCalledTimes(1);
		expect(onDelete).toHaveBeenCalledTimes(1);
		await expect
			.element(screen.getByText("Edit modal open"))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByText("Delete modal for Home Gym"))
			.not.toBeInTheDocument();
	});

	it("closes the internal modals when they request to close", async () => {
		const screen = await render(
			<GymMenu
				gym={{
					id: "gym-1",
					name: "Home Gym",
					equipmentIds: [],
				}}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Edit" }));
		await expect
			.element(screen.getByText("Edit modal open"))
			.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: "Close edit modal" }),
		);
		await expect
			.element(screen.getByText("Edit modal open"))
			.not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Delete" }));
		await expect
			.element(screen.getByText("Delete modal for Home Gym"))
			.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: "Close delete modal" }),
		);
		await expect
			.element(screen.getByText("Delete modal for Home Gym"))
			.not.toBeInTheDocument();
	});
});
