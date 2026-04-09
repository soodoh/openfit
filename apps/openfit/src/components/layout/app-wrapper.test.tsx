import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppWrapper } from "./app-wrapper";

vi.mock("./header", () => ({
	Header: () => <div data-testid="header-shell" />,
}));

vi.mock("@/components/providers/theme-sync", () => ({
	ThemeSync: () => <div data-testid="theme-sync-shell" />,
}));

describe("AppWrapper", () => {
	it("renders the header, theme sync, and child content in the app shell", () => {
		const { container } = render(
			<AppWrapper>
				<main data-testid="app-child">app content</main>
			</AppWrapper>,
		);

		expect(screen.getByTestId("theme-sync-shell")).toBeInTheDocument();
		expect(screen.getByTestId("header-shell")).toBeInTheDocument();
		expect(screen.getByTestId("app-child")).toHaveTextContent("app content");
		expect(container.firstElementChild).toHaveClass("min-h-dvh");
	});
});
