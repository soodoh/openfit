import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AdminPage } from "./admin-page";

vi.mock("./shared-entities-view", () => ({
	SharedEntitiesView: () => <div>Shared entities body</div>,
}));

vi.mock("./user-table", () => ({
	UserTable: () => <div>Users body</div>,
}));

vi.mock("./auth-providers-table", () => ({
	AuthProvidersTable: () => <div>Auth body</div>,
}));

describe("AdminPage", () => {
	it("shows the admin shell and switches between the top-level tabs", async () => {
		const screen = await render(<AdminPage />);

		await expect
			.element(screen.getByRole("heading", { name: "Admin Panel" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Shared entities body"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("tab", { name: "Users" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("tab", { name: "Auth" }))
			.toBeInTheDocument();
	});
});
