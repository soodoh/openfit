import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	readFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
	default: {
		readFile: mocks.readFile,
	},
	readFile: mocks.readFile,
}));

import UploadsRoute from "@/routes/api/uploads.$";

const handlers = UploadsRoute.options.server?.handlers as {
	GET: ({ params }: { params: Record<string, string> }) => Promise<Response>;
};

beforeEach(() => {
	vi.resetAllMocks();
});

describe("GET /api/uploads/$", () => {
	it("returns 404 for invalid filenames", async () => {
		const response = await handlers.GET({
			params: { _splat: "../secret.txt" },
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not found");
		expect(mocks.readFile).not.toHaveBeenCalled();
	});

	it("returns 404 when the file cannot be read", async () => {
		mocks.readFile.mockRejectedValueOnce(new Error("ENOENT"));

		const response = await handlers.GET({
			params: { _splat: "avatars/missing.png" },
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not found");
		expect(mocks.readFile).toHaveBeenCalledTimes(1);
		expect(mocks.readFile.mock.calls[0]?.[0]).toMatch(
			/\/data\/uploads\/avatars\/missing\.png$/,
		);
	});

	it("serves the file with content headers", async () => {
		mocks.readFile.mockResolvedValueOnce(Buffer.from([10, 20, 30]));

		const response = await handlers.GET({
			params: { _splat: "avatars/avatar.webp" },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/webp");
		expect(response.headers.get("cache-control")).toBe(
			"public, max-age=31536000, immutable",
		);
		expect(Buffer.from(await response.arrayBuffer())).toEqual(
			Buffer.from([10, 20, 30]),
		);
		expect(mocks.readFile).toHaveBeenCalledTimes(1);
		expect(mocks.readFile.mock.calls[0]?.[0]).toMatch(
			/\/data\/uploads\/avatars\/avatar\.webp$/,
		);
	});
});
