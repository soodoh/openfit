import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Header } from "./header";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		...props
	}: {
		children: ReactNode;
		to: string;
		[key: string]: unknown;
	}) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@unpic/react", () => ({
	Image: ({
		alt,
		src,
		...props
	}: {
		alt: string;
		src: string;
		[key: string]: unknown;
	}) => <img alt={alt} src={src} {...props} />,
}));

vi.mock("./account-nav-item", () => ({
	AccountNavItem: () => <div data-testid="account-nav-item" />,
}));

vi.mock("@/components/ui/sheet", () => ({
	Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SheetClose: ({ children }: { children: ReactNode }) => <>{children}</>,
	SheetContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SheetTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("Header", () => {
	it("renders desktop and mobile navigation plus the account menu", async () => {
		const screen = await render(<Header />);

		await expect
			.element(screen.getByRole("link", { name: "OpenFit logo" }))
			.toBeInTheDocument();
		expect(screen.getAllByRole("link", { name: "Routines" })).toHaveLength(2);
		expect(screen.getAllByRole("link", { name: "Exercises" })).toHaveLength(2);
		expect(screen.getAllByRole("link", { name: "Logs" })).toHaveLength(2);
		await expect
			.element(screen.getByRole("button", { name: "Open navigation menu" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("account-nav-item"))
			.toBeInTheDocument();
	});
});
