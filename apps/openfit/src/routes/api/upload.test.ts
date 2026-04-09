import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	mkdir: vi.fn(),
	nanoid: vi.fn(),
	requireAdmin: vi.fn(),
	unlink: vi.fn(),
	writeFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
	default: {
		mkdir: mocks.mkdir,
		unlink: mocks.unlink,
		writeFile: mocks.writeFile,
	},
	mkdir: mocks.mkdir,
	unlink: mocks.unlink,
	writeFile: mocks.writeFile,
}));

vi.mock("nanoid", () => ({
	nanoid: mocks.nanoid,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAdmin: mocks.requireAdmin,
}));

import UploadRoute from "@/routes/api/upload";

const handlers = UploadRoute.options.server?.handlers as {
	DELETE: ({ request }: { request: Request }) => Promise<Response>;
	POST: ({ request }: { request: Request }) => Promise<Response>;
};

function createUploadRequest(file: File | null): Request {
	const formData = new FormData();
	if (file) {
		formData.set("file", file);
	}

	return {
		formData: vi.fn().mockResolvedValue(formData),
	} as unknown as Request;
}

function createDeleteRequest(search = "") {
	return new Request(`http://localhost/api/upload${search}`, {
		method: "DELETE",
	});
}

function createBinaryFile(name: string, type: string): File {
	return new File([Buffer.from("upload body")], name, { type });
}

beforeEach(() => {
	vi.resetAllMocks();
	mocks.mkdir.mockResolvedValue(undefined);
	mocks.nanoid.mockReturnValue("upload-id");
	mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
	mocks.unlink.mockResolvedValue(undefined);
	mocks.writeFile.mockResolvedValue(undefined);
});

describe("POST /api/upload", () => {
	it("returns the auth response when admin checks fail with a Response", async () => {
		mocks.requireAdmin.mockRejectedValueOnce(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.POST({
			request: createUploadRequest(null),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
	});

	it("returns 401 when admin checks fail with a generic error", async () => {
		mocks.requireAdmin.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.POST({
			request: createUploadRequest(null),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 400 when no file is provided", async () => {
		const response = await handlers.POST({
			request: createUploadRequest(null),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "No file provided",
		});
	});

	it("returns a validation error for unsupported file types", async () => {
		const response = await handlers.POST({
			request: createUploadRequest(
				createBinaryFile("document.pdf", "application/pdf"),
			),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error:
				"Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
		});
	});

	it("returns 500 when the upload destination cannot be prepared", async () => {
		mocks.nanoid.mockReturnValueOnce("../escape");

		const response = await handlers.POST({
			request: createUploadRequest(createBinaryFile("avatar.png", "image/png")),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to prepare upload destination",
		});
	});

	it("writes the file and returns the uploaded path", async () => {
		const response = await handlers.POST({
			request: createUploadRequest(createBinaryFile("avatar.png", "image/png")),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			path: "/api/uploads/upload-id.png",
			filename: "upload-id.png",
		});
		expect(mocks.mkdir).toHaveBeenCalledWith(expect.any(String), {
			recursive: true,
		});
		expect(mocks.writeFile).toHaveBeenCalledTimes(1);

		const [filepath, buffer] = mocks.writeFile.mock.calls[0] as [
			string,
			Buffer,
		];
		expect(filepath).toMatch(/\/data\/uploads\/upload-id\.png$/);
		expect(Buffer.from(buffer)).toEqual(Buffer.from("upload body"));
	});
});

describe("DELETE /api/upload", () => {
	it("returns the auth response when admin checks fail with a Response", async () => {
		mocks.requireAdmin.mockRejectedValueOnce(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.DELETE({
			request: createDeleteRequest("?filename=avatar.png"),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
	});

	it("returns 401 when admin checks fail with a generic error", async () => {
		mocks.requireAdmin.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.DELETE({
			request: createDeleteRequest("?filename=avatar.png"),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns 400 when the filename query parameter is missing", async () => {
		const response = await handlers.DELETE({
			request: createDeleteRequest(),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Invalid query parameters",
			issues: [
				{
					message: "Filename is required",
					path: ["filename"],
				},
			],
		});
	});

	it("returns 400 when the filename is invalid", async () => {
		const response = await handlers.DELETE({
			request: createDeleteRequest("?filename=../secret.txt"),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Invalid filename",
		});
		expect(mocks.unlink).not.toHaveBeenCalled();
	});

	it("deletes the file and returns success", async () => {
		const response = await handlers.DELETE({
			request: createDeleteRequest("?filename=avatars/avatar.png"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.unlink).toHaveBeenCalledTimes(1);
		expect(mocks.unlink.mock.calls[0]?.[0]).toMatch(
			/\/data\/uploads\/avatars\/avatar\.png$/,
		);
	});

	it("returns 404 when the file does not exist", async () => {
		const error = new Error("missing") as Error & { code: string };
		error.code = "ENOENT";
		mocks.unlink.mockRejectedValueOnce(error);

		const response = await handlers.DELETE({
			request: createDeleteRequest("?filename=avatars/missing.png"),
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "File not found" });
	});

	it("returns 500 for unexpected delete failures", async () => {
		mocks.unlink.mockRejectedValueOnce(new Error("boom"));

		const response = await handlers.DELETE({
			request: createDeleteRequest("?filename=avatars/avatar.png"),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to delete file",
		});
	});
});
