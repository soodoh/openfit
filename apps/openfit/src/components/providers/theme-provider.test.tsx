import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	it("renders children and forwards props to next-themes provider", async () => {
		const screen = await render(
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem={false}
				disableTransitionOnChange
			>
				<span>Theme child</span>
			</ThemeProvider>,
		);

		await expect
			.element(screen.getByTestId("next-themes-provider"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Theme child")).toBeInTheDocument();
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
