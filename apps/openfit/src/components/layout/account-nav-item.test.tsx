import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
	ProfileModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
		open ? (
			<div data-testid="profile-modal">
				profile modal
				<button type="button" onClick={onClose}>
					Close profile modal
				</button>
			</div>
		) : null,
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

	it("does not render when the user is anonymous", async () => {
		const screen = await render(<AccountNavItem />);

		await expect.element(screen.getByRole("button")).not.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("profile-modal"))
			.not.toBeInTheDocument();
	});

	it("renders admin actions and signs out to the sign-in page", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true });
		mockUseUserProfile.mockReturnValue({
			data: { role: "ADMIN" },
		});

		const screen = await render(<AccountNavItem />);

		await userEvent.click(screen.getByRole("button", { name: "Admin" }));
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/admin" });

		await userEvent.click(screen.getByRole("button", { name: "Profile" }));
		await expect
			.element(screen.getByTestId("profile-modal"))
			.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Logout" }));

		await vi.waitFor(() => {
			expect(mockSignOut).toHaveBeenCalledTimes(1);
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/signin" });
		});
	});

	it("hides admin actions for non-admin users", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true });
		mockUseUserProfile.mockReturnValue({
			data: { role: "USER" },
		});

		const screen = await render(<AccountNavItem />);

		await expect
			.element(screen.getByRole("button", { name: "Admin" }))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Profile" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Logout" }))
			.toBeInTheDocument();
	});

	it("closes the profile modal when it requests to close", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true });
		mockUseUserProfile.mockReturnValue({
			data: { role: "USER" },
		});

		const screen = await render(<AccountNavItem />);

		await userEvent.click(screen.getByRole("button", { name: "Profile" }));
		await expect
			.element(screen.getByTestId("profile-modal"))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Close profile modal" }),
		);

		await expect
			.element(screen.getByTestId("profile-modal"))
			.not.toBeInTheDocument();
	});
});
