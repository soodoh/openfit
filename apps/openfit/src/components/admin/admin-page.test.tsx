import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
	it("shows the admin shell and switches between the top-level tabs", () => {
		render(<AdminPage />);

		expect(
			screen.getByRole("heading", { name: "Admin Panel" }),
		).toBeInTheDocument();
		expect(screen.getByText("Shared entities body")).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Users" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Auth" })).toBeInTheDocument();
	});
});
