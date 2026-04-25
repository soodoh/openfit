import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AdminPage } from "./admin-page";

vi.mock("./shared-entities-view", () => ({
	SharedEntitiesView: () => <div>Shared entities body</div>,
}));

vi.mock("./user-table", () => ({
	UserTable: () => <div>Users body</div>,
}));

describe("AdminPage", () => {
	it("renders shared entities and users tabs", async () => {
		const screen = await render(<AdminPage />);

		await expect
			.element(screen.getByRole("tab", { name: /shared entities/i }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("tab", { name: /users/i }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("tab", { name: /auth/i }))
			.not.toBeInTheDocument();
	});
});
