import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	buildUploadFilename,
	getUploadContentType,
	MAX_UPLOAD_SIZE_BYTES,
	resolveUploadPath,
	UploadValidationError,
	validateUploadFile,
} from "./uploads";

describe("validateUploadFile", () => {
	it("accepts supported image types and returns their stored extension", () => {
		expect(validateUploadFile({ size: 1_024, type: "image/png" })).toEqual({
			extension: "png",
			mimeType: "image/png",
		});
	});

	it("rejects unsupported file types", () => {
		expect(() =>
			validateUploadFile({ size: 128, type: "image/svg+xml" }),
		).toThrowError(UploadValidationError);
	});

	it("rejects files that exceed the maximum size", () => {
		expect(() =>
			validateUploadFile({
				size: MAX_UPLOAD_SIZE_BYTES + 1,
				type: "image/webp",
			}),
		).toThrowError("File too large. Maximum size is 5MB.");
	});
});

describe("buildUploadFilename", () => {
	it("uses the validated mime type extension instead of the user-supplied name", () => {
		expect(buildUploadFilename("image/jpeg", () => "file-id")).toBe(
			"file-id.jpg",
		);
	});
});

describe("resolveUploadPath", () => {
	it("resolves files within the upload directory", () => {
		const uploadDir = path.resolve("/tmp/uploads");
		expect(resolveUploadPath(uploadDir, "nested/file.webp")).toBe(
			path.join(uploadDir, "nested/file.webp"),
		);
	});

	it("rejects directory traversal attempts", () => {
		const uploadDir = path.resolve("/tmp/uploads");
		expect(resolveUploadPath(uploadDir, "../secrets.txt")).toBeNull();
		expect(resolveUploadPath(uploadDir, "/etc/passwd")).toBeNull();
		expect(resolveUploadPath(uploadDir, ".")).toBeNull();
		expect(resolveUploadPath(uploadDir, "///")).toBeNull();
	});
});

describe("getUploadContentType", () => {
	it("returns the stored mime type for supported files", () => {
		expect(getUploadContentType("example.gif")).toBe("image/gif");
	});

	it("falls back to application/octet-stream for unknown extensions", () => {
		expect(getUploadContentType("example.bin")).toBe(
			"application/octet-stream",
		);
	});
});
