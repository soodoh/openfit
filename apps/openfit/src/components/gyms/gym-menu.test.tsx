import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
	DeleteGymModal: ({ gym }: { gym?: { name: string } }) =>
		gym ? <div>Delete modal for {gym.name}</div> : null,
}));

vi.mock("./gym-form-modal", () => ({
	GymFormModal: ({ open }: { open: boolean }) =>
		open ? <div>Edit modal open</div> : null,
}));

describe("GymMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows actions, opens the internal modals, and sets the default gym", async () => {
		render(
			<GymMenu
				gym={{
					id: "gym-1",
					name: "Home Gym",
					equipmentIds: [],
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Set as Default" }));
		expect(mockSetDefaultGym).toHaveBeenCalledWith("gym-1");

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByText("Edit modal open")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(screen.getByText("Delete modal for Home Gym")).toBeInTheDocument();
	});

	it("hides the default action when the gym is already default", () => {
		render(
			<GymMenu
				gym={{
					id: "gym-1",
					name: "Home Gym",
					equipmentIds: [],
				}}
				isDefault
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Set as Default" }),
		).not.toBeInTheDocument();
	});
});
