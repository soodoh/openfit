import { describe, expect, it, vi } from "vitest";

const createRouter = vi.hoisted(() => vi.fn());
const routeTree = vi.hoisted(() => ({ id: "route-tree" }));

vi.mock("@tanstack/react-router", () => ({
	createRouter,
}));

vi.mock("./routeTree.gen", () => ({
	routeTree,
}));

describe("router", () => {
	it("creates a router with the generated route tree and scroll restoration", async () => {
		const routerModule = await import("./router");

		createRouter.mockReturnValueOnce({ id: "router-instance" });

		expect(routerModule.getRouter()).toEqual({ id: "router-instance" });
		expect(createRouter).toHaveBeenCalledWith({
			routeTree,
			scrollRestoration: true,
		});
		expect(routerModule.default).toBe(routerModule.getRouter);
	});
});
