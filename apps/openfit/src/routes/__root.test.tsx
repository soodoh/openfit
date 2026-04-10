import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import RootRoute from "./__root";

const mockHeadContent = vi.fn(() => null);

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
		"@tanstack/react-router",
	);

	return {
		...actual,
		HeadContent: () => mockHeadContent(),
		Outlet: () => <div data-testid="route-outlet">route outlet</div>,
		Scripts: () => <div data-testid="scripts" />,
	};
});

vi.mock("@/components/layout/app-wrapper", () => ({
	AppWrapper: ({ children }: { children: ReactNode }) => (
		<div data-testid="app-wrapper">{children}</div>
	),
}));

vi.mock("@/components/providers/auth-provider", () => ({
	AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/providers/query-provider", () => ({
	QueryProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/providers/theme-provider", () => ({
	ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("root route", () => {
	it("declares the document head metadata and wraps the shell providers", async () => {
		mockHeadContent.mockClear();
		const head = RootRoute.options.head?.();

		expect(head?.meta).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ charSet: "utf8" }),
				expect.objectContaining({ title: "OpenFit" }),
				expect.objectContaining({
					name: "description",
					content: "Open source fitness app",
				}),
			]),
		);
		expect(head?.links).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ rel: "stylesheet" }),
				expect.objectContaining({ rel: "icon", href: "/favicon.svg" }),
				expect.objectContaining({
					rel: "preconnect",
					href: "https://fonts.googleapis.com",
				}),
			]),
		);

		const screen = await render(<RootRoute.options.component />);

		expect(mockHeadContent).toHaveBeenCalledTimes(1);
		await expect.element(screen.getByTestId("scripts")).toBeInTheDocument();
		await expect.element(screen.getByTestId("app-wrapper")).toBeInTheDocument();
		await expect
			.element(screen.getByTestId("route-outlet"))
			.toBeInTheDocument();
	});
});
