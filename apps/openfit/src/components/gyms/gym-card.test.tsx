import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { GymCard } from "./gym-card";

vi.mock("./gym-menu", () => ({
	GymMenu: () => <div>Gym menu</div>,
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

describe("GymCard", () => {
	it("shows the default badge and equipment count", () => {
		render(
			<GymCard
				gym={{
					id: "gym-1",
					name: "Home Gym",
					equipmentIds: ["equipment-1"],
				}}
				isDefault
			/>,
		);

		expect(screen.getByText("Home Gym")).toBeInTheDocument();
		expect(screen.getByText("Default")).toBeInTheDocument();
		expect(screen.getByText("1 equipment item")).toBeInTheDocument();
		expect(screen.getByText("Gym menu")).toBeInTheDocument();
	});

	it("uses the plural equipment label for non-default gyms", () => {
		render(
			<GymCard
				gym={{
					id: "gym-2",
					name: "Garage Gym",
					equipmentIds: ["equipment-1", "equipment-2"],
				}}
			/>,
		);

		expect(screen.getByText("Garage Gym")).toBeInTheDocument();
		expect(screen.getByText("2 equipment items")).toBeInTheDocument();
		expect(screen.queryByText("Default")).not.toBeInTheDocument();
	});
});
