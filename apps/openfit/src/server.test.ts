import { describe, expect, it, vi } from "vitest";

const fetchHandler = vi.hoisted(() => vi.fn());
const createServerEntry = vi.hoisted(() => vi.fn((entry) => entry));

vi.mock("@tanstack/react-start/server-entry", () => ({
	default: {
		fetch: fetchHandler,
	},
	createServerEntry,
}));

describe("server", () => {
	it("creates a server entry that delegates fetch requests to the start handler", async () => {
		const serverModule = await import("./server");
		const request = new Request("http://localhost");
		const response = new Response("ok");

		fetchHandler.mockResolvedValueOnce(response);

		expect(createServerEntry).toHaveBeenCalledTimes(1);
		await expect(serverModule.default.fetch(request)).resolves.toBe(response);
		expect(fetchHandler).toHaveBeenCalledWith(request);
	});
});
