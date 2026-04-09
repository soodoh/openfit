import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StorageHandlers = {
	GET: ({ params }: { params: Record<string, string> }) => Promise<Response>;
	POST: ({
		request,
		params,
	}: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

const originalEnv = {
	CONVEX_SELF_HOSTED_URL: process.env.CONVEX_SELF_HOSTED_URL,
	NODE_ENV: process.env.NODE_ENV,
};

const fetchMock = vi.fn();

async function loadHandlers() {
	vi.resetModules();
	const { default: StorageRoute } = await import("@/routes/api/storage.$");
	return StorageRoute.options.server?.handlers as StorageHandlers;
}

function restoreEnv() {
	if (originalEnv.CONVEX_SELF_HOSTED_URL === undefined) {
		delete process.env.CONVEX_SELF_HOSTED_URL;
	} else {
		process.env.CONVEX_SELF_HOSTED_URL = originalEnv.CONVEX_SELF_HOSTED_URL;
	}

	if (originalEnv.NODE_ENV === undefined) {
		delete process.env.NODE_ENV;
	} else {
		process.env.NODE_ENV = originalEnv.NODE_ENV;
	}
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	restoreEnv();
});

describe("GET /api/storage/$", () => {
	it("returns 404 outside development", async () => {
		process.env.NODE_ENV = "production";

		const handlers = await loadHandlers();
		const response = await handlers.GET({
			params: { _splat: "images/avatar.png" },
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not found");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("returns 404 for POST outside development", async () => {
		process.env.NODE_ENV = "production";

		const handlers = await loadHandlers();
		const response = await handlers.POST({
			request: new Request("http://localhost/api/storage/images/avatar.png", {
				method: "POST",
				body: "upload body",
			}),
			params: { _splat: "images/avatar.png" },
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not found");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("proxies successful requests and falls back to image/jpeg when the upstream content type is missing", async () => {
		process.env.NODE_ENV = "development";
		process.env.CONVEX_SELF_HOSTED_URL = "http://convex.example.com";
		fetchMock.mockResolvedValueOnce(
			new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
		);

		const handlers = await loadHandlers();
		const response = await handlers.GET({
			params: { _splat: "images/avatar.png" },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://convex.example.com/api/storage/images/avatar.png",
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/jpeg");
		expect(response.headers.get("cache-control")).toBe(
			"public, max-age=31536000, immutable",
		);
		expect(Buffer.from(await response.arrayBuffer())).toEqual(
			Buffer.from([1, 2, 3]),
		);
	});

	it("preserves an upstream content type when one is provided", async () => {
		process.env.NODE_ENV = "development";
		process.env.CONVEX_SELF_HOSTED_URL = "http://convex.example.com";
		fetchMock.mockResolvedValueOnce(
			new Response(new Uint8Array([4, 5, 6]), {
				status: 200,
				headers: { "Content-Type": "image/png" },
			}),
		);

		const handlers = await loadHandlers();
		const response = await handlers.GET({
			params: { _splat: "images/avatar.png" },
		});

		expect(response.headers.get("content-type")).toBe("image/png");
		expect(Buffer.from(await response.arrayBuffer())).toEqual(
			Buffer.from([4, 5, 6]),
		);
	});

	it("passes through upstream failure responses", async () => {
		process.env.NODE_ENV = "development";
		process.env.CONVEX_SELF_HOSTED_URL = "http://convex.example.com";
		fetchMock.mockResolvedValueOnce(new Response("not found", { status: 404 }));

		const handlers = await loadHandlers();
		const response = await handlers.GET({
			params: { _splat: "images/avatar.png" },
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("");
	});
});

describe("POST /api/storage/$", () => {
	it("forwards the body, content type, and query string to the upstream storage endpoint", async () => {
		process.env.NODE_ENV = "development";
		process.env.CONVEX_SELF_HOSTED_URL = "http://convex.example.com";
		fetchMock.mockResolvedValueOnce(Response.json({ stored: true }));

		const handlers = await loadHandlers();
		const body = Buffer.from("upload body");
		const request = {
			url: "http://localhost/api/storage/images/avatar.png?version=2&download=true",
			headers: new Headers(),
			arrayBuffer: vi
				.fn()
				.mockResolvedValue(
					body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
				),
		} as unknown as Request;

		const response = await handlers.POST({
			request,
			params: { _splat: "images/avatar.png" },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://convex.example.com/api/storage/images/avatar.png?version=2&download=true",
			expect.objectContaining({
				method: "POST",
				headers: {
					"Content-Type": "application/octet-stream",
				},
			}),
		);

		const [, init] = fetchMock.mock.calls[0] as [
			string,
			RequestInit & { body: ArrayBuffer },
		];
		expect(Buffer.from(init.body)).toEqual(Buffer.from("upload body"));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ stored: true });
	});

	it("forwards an explicit content type to the upstream storage endpoint", async () => {
		process.env.NODE_ENV = "development";
		process.env.CONVEX_SELF_HOSTED_URL = "http://convex.example.com";
		fetchMock.mockResolvedValueOnce(Response.json({ stored: true }));

		const handlers = await loadHandlers();
		const request = new Request(
			"http://localhost/api/storage/images/avatar.png?version=3",
			{
				method: "POST",
				body: "upload body",
				headers: {
					"Content-Type": "image/png",
				},
			},
		);

		const response = await handlers.POST({
			request,
			params: { _splat: "images/avatar.png" },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"http://convex.example.com/api/storage/images/avatar.png?version=3",
			expect.objectContaining({
				method: "POST",
				headers: {
					"Content-Type": "image/png",
				},
			}),
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ stored: true });
	});

	it("passes through non-ok upstream responses", async () => {
		process.env.NODE_ENV = "development";
		process.env.CONVEX_SELF_HOSTED_URL = "http://convex.example.com";
		fetchMock.mockResolvedValueOnce(
			new Response("upstream failed", { status: 503 }),
		);

		const handlers = await loadHandlers();
		const request = new Request(
			"http://localhost/api/storage/images/avatar.png",
			{
				method: "POST",
				body: "upload body",
			},
		);

		const response = await handlers.POST({
			request,
			params: { _splat: "images/avatar.png" },
		});

		expect(response.status).toBe(503);
		expect(await response.text()).toBe("upstream failed");
	});
});
