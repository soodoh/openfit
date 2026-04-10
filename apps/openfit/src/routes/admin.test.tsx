import { page } from "@vitest/browser/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import AdminRoute from "./admin";

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();
const mockParseResponseJson = vi.fn();
const mockFetch = vi.fn();

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
		"@tanstack/react-router",
	);

	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/components/providers/auth-provider", () => ({
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/admin/admin-page", () => ({
	AdminPage: () => <div data-testid="admin-page">admin page</div>,
}));

vi.mock("@/lib/request-helpers", () => ({
	parseResponseJson: (...args: unknown[]) => mockParseResponseJson(...args),
}));

describe("admin route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
		mockParseResponseJson.mockResolvedValue({ isAdmin: true });
		mockFetch.mockResolvedValue({ ok: true });
		vi.stubGlobal("fetch", mockFetch);
	});

	it("redirects anonymous users to sign in", async () => {
		await render(<AdminRoute.options.component />);

		await vi.waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/signin" });
		});
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("shows a loading spinner while auth is still loading", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

		const screen = await render(<AdminRoute.options.component />);

		// Loading spinner is shown; admin-page is not present
		await expect
			.element(
				page.elementLocator(document.querySelector(".animate-spin") as Element),
			)
			.toBeInTheDocument();
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("shows the admin page after confirming admin access", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		mockFetch.mockResolvedValue({ ok: true });
		mockParseResponseJson.mockResolvedValue({ isAdmin: true });

		await render(<AdminRoute.options.component />);

		await vi.waitFor(() =>
			expect(document.querySelector("[data-testid='admin-page']")).toBeTruthy(),
		);

		expect(mockFetch).toHaveBeenCalledWith("/api/admin/check");
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("returns to the dashboard when the admin check fails", async () => {
		mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		mockFetch.mockResolvedValue({ ok: true });
		mockParseResponseJson.mockResolvedValue({ isAdmin: false });

		await render(<AdminRoute.options.component />);

		await vi.waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
		});
		expect(document.querySelector("[data-testid='admin-page']")).toBeNull();
	});
});
