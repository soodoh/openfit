import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AppWrapper } from "./app-wrapper";

vi.mock("./header", () => ({
	Header: () => <div data-testid="header-shell" />,
}));

vi.mock("@/components/providers/theme-sync", () => ({
	ThemeSync: () => <div data-testid="theme-sync-shell" />,
}));

describe("AppWrapper", () => {
	it("renders the header, theme sync, and child content in the app shell", async () => {
		const screen = await render(
			<AppWrapper>
				<main data-testid="app-child">app content</main>
			</AppWrapper>,
		);

		await expect
			.element(screen.getByTestId("theme-sync-shell"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("header-shell"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("app-child"))
			.toHaveTextContent("app content");
		await expect
			.element(screen.getByTestId("app-child").element().closest(".min-h-dvh"))
			.toBeInTheDocument();
	});
});
