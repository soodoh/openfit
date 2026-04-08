import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./theme-provider";

const mockNextThemesProvider = vi.fn(
	(props: { children: ReactNode; [key: string]: unknown }) => (
		<div data-testid="next-themes-provider">{props.children}</div>
	),
);

vi.mock("next-themes", () => ({
	ThemeProvider: (props: { children: ReactNode; [key: string]: unknown }) =>
		mockNextThemesProvider(props),
}));

describe("ThemeProvider", () => {
	beforeEach(() => {
		mockNextThemesProvider.mockClear();
	});

	it("renders children and forwards props to next-themes provider", () => {
		render(
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem={false}
				disableTransitionOnChange
			>
				<span>Theme child</span>
			</ThemeProvider>,
		);

		expect(screen.getByTestId("next-themes-provider")).toBeInTheDocument();
		expect(screen.getByText("Theme child")).toBeInTheDocument();
		expect(mockNextThemesProvider).toHaveBeenCalledTimes(1);

		const forwardedProps = mockNextThemesProvider.mock.calls[0]?.[0];
		expect(forwardedProps).toMatchObject({
			attribute: "class",
			defaultTheme: "system",
			enableSystem: false,
			disableTransitionOnChange: true,
		});
	});
});
