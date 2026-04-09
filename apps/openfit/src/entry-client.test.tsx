import { afterEach, describe, expect, it, vi } from "vitest";

const hydrateRoot = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-start/client", () => ({
	StartClient: () => <div data-testid="start-client" />,
}));

vi.mock("react-dom/client", () => ({
	hydrateRoot,
}));

describe("entry-client", () => {
	afterEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("hydrates the app into the document root", async () => {
		await import("./entry-client");

		expect(hydrateRoot).toHaveBeenCalledTimes(1);
		expect(hydrateRoot.mock.calls[0]?.[0]).toBe(document);
		expect(hydrateRoot.mock.calls[0]?.[1]).toMatchObject({
			props: {
				children: expect.objectContaining({
					type: expect.any(Function),
				}),
			},
		});
	});
});
