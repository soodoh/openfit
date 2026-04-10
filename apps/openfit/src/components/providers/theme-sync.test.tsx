import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ThemeSync } from "./theme-sync";

const mockSetTheme = vi.fn();
const mockUseAuth = vi.fn();
const mockUseUserProfile = vi.fn();

vi.mock("next-themes", () => ({
	useTheme: () => ({
		setTheme: mockSetTheme,
	}),
}));

vi.mock("@/components/providers/auth-provider", () => ({
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks", () => ({
	useUserProfile: () => mockUseUserProfile(),
}));

describe("ThemeSync", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("syncs the stored theme when the user is authenticated", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		mockUseUserProfile.mockReturnValue({
			data: { theme: "dark" },
		});

		await render(<ThemeSync />);

		expect(mockSetTheme).toHaveBeenCalledWith("dark");
	});

	it("does not sync a theme when the user is anonymous", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
		mockUseUserProfile.mockReturnValue({
			data: { theme: "light" },
		});

		await render(<ThemeSync />);

		expect(mockSetTheme).not.toHaveBeenCalled();
	});
});
