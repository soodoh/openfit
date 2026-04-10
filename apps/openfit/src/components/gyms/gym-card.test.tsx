import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { GymCard } from "./gym-card";

vi.mock("./gym-menu", () => ({
	GymMenu: () => <div>Gym menu</div>,
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

describe("GymCard", () => {
	it("shows the default badge and equipment count", async () => {
		const screen = await render(
			<GymCard
				gym={{
					id: "gym-1",
					name: "Home Gym",
					equipmentIds: ["equipment-1"],
				}}
				isDefault
			/>,
		);

		await expect.element(screen.getByText("Home Gym")).toBeInTheDocument();
		await expect.element(screen.getByText("Default")).toBeInTheDocument();
		await expect
			.element(screen.getByText("1 equipment item"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Gym menu")).toBeInTheDocument();
	});

	it("uses the plural equipment label for non-default gyms", async () => {
		const screen = await render(
			<GymCard
				gym={{
					id: "gym-2",
					name: "Garage Gym",
					equipmentIds: ["equipment-1", "equipment-2"],
				}}
			/>,
		);

		await expect.element(screen.getByText("Garage Gym")).toBeInTheDocument();
		await expect
			.element(screen.getByText("2 equipment items"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Default")).not.toBeInTheDocument();
	});
});
