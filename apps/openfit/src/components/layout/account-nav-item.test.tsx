import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountNavItem } from "./account-nav-item";

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();
const mockUseUserProfile = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/components/providers/auth-provider", () => ({
	signOut: (...args: unknown[]) => mockSignOut(...args),
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks", () => ({
	useUserProfile: () => mockUseUserProfile(),
}));

vi.mock("@/components/profile/profile-modal", () => ({
	ProfileModal: ({ open }: { open: boolean }) =>
		open ? <div data-testid="profile-modal">profile modal</div> : null,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
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

describe("AccountNavItem", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseAuth.mockReturnValue({ isAuthenticated: false });
		mockUseUserProfile.mockReturnValue({ data: undefined });
		mockSignOut.mockResolvedValue(undefined);
	});

	it("does not render when the user is anonymous", () => {
		render(<AccountNavItem />);

		expect(screen.queryByRole("button")).not.toBeInTheDocument();
		expect(screen.queryByTestId("profile-modal")).not.toBeInTheDocument();
	});

	it("renders admin actions and signs out to the sign-in page", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true });
		mockUseUserProfile.mockReturnValue({
			data: { role: "ADMIN" },
		});

		render(<AccountNavItem />);

		fireEvent.click(screen.getByRole("button", { name: "Admin" }));
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/admin" });

		fireEvent.click(screen.getByRole("button", { name: "Profile" }));
		expect(screen.getByTestId("profile-modal")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Logout" }));

		await waitFor(() => {
			expect(mockSignOut).toHaveBeenCalledTimes(1);
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/signin" });
		});
	});

	it("hides admin actions for non-admin users", () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true });
		mockUseUserProfile.mockReturnValue({
			data: { role: "USER" },
		});

		render(<AccountNavItem />);

		expect(
			screen.queryByRole("button", { name: "Admin" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
	});
});
