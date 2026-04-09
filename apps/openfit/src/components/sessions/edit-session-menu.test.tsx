import { fireEvent, render, screen } from "@testing-library/react";
import {
	cloneElement,
	createContext,
	type ReactElement,
	type ReactNode,
	useContext,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkoutSessionWithData } from "@/lib/types";
import { EditSessionMenu } from "./edit-session-menu";

const MenuContext = createContext<{
	open: boolean;
	setOpen: (open: boolean) => void;
}>({
	open: false,
	setOpen: () => undefined,
});

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({
		children,
		open,
		onOpenChange,
	}: {
		children: ReactNode;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}) => {
		return (
			<MenuContext.Provider
				value={{
					open: open ?? false,
					setOpen: onOpenChange ?? (() => undefined),
				}}
			>
				{children}
			</MenuContext.Provider>
		);
	},
	DropdownMenuTrigger: ({ children }: { children: ReactNode }) => {
		const { setOpen } = useContext(MenuContext);
		if (typeof children !== "object" || !children) {
			return <>{children}</>;
		}
		const trigger = children as ReactElement<{
			onClick?: () => void;
		}>;
		return cloneElement(trigger, {
			onClick: () => {
				trigger.props.onClick?.();
				setOpen(true);
			},
		});
	},
	DropdownMenuContent: ({ children }: { children: ReactNode }) => {
		const { open } = useContext(MenuContext);
		return open ? <div>{children}</div> : null;
	},
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
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: {
		children: ReactNode;
		[key: string]: unknown;
	}) => <button {...props}>{children}</button>,
}));

vi.mock("./delete-session-modal", () => ({
	DeleteSessionModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div data-testid="delete-session-modal">
				<button type="button" onClick={onClose}>
					Confirm delete
				</button>
			</div>
		) : null,
}));

vi.mock("./edit-session-modal", () => ({
	EditSessionModal: ({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) =>
		open ? (
			<div data-testid="edit-session-modal">
				<button type="button" onClick={onClose}>
					Close edit modal
				</button>
			</div>
		) : null,
}));

const session = {
	id: "session-1",
	userId: "user-1",
	name: "Leg Day",
	notes: "",
	impression: null,
	startTime: new Date("2026-04-01T10:00:00.000Z"),
	endTime: null,
	templateId: null,
	createdAt: new Date("2026-04-01T10:00:00.000Z"),
	updatedAt: new Date("2026-04-01T10:00:00.000Z"),
	setGroups: [],
} satisfies WorkoutSessionWithData;

describe("EditSessionMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("opens the edit modal and closes the menu when Edit is selected", () => {
		render(<EditSessionMenu session={session} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Edit actions for workout session session-1",
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));

		expect(screen.getByTestId("edit-session-modal")).toBeInTheDocument();
		expect(screen.queryByText("Delete")).not.toBeInTheDocument();
	});

	it("opens the delete modal when Delete is selected", () => {
		render(<EditSessionMenu session={session} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Edit actions for workout session session-1",
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		expect(screen.getByTestId("delete-session-modal")).toBeInTheDocument();
	});

	it("closes the edit modal when the modal requests to close", () => {
		render(<EditSessionMenu session={session} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Edit actions for workout session session-1",
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByTestId("edit-session-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Close edit modal" }));

		expect(screen.queryByTestId("edit-session-modal")).not.toBeInTheDocument();
	});

	it("closes the delete modal when the modal requests to close", () => {
		render(<EditSessionMenu session={session} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Edit actions for workout session session-1",
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		expect(screen.getByTestId("delete-session-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

		expect(
			screen.queryByTestId("delete-session-modal"),
		).not.toBeInTheDocument();
	});
});
