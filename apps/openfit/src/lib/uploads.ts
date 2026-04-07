import path from "node:path";

const MIME_TYPES = {
	"image/gif": "gif",
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
} as const;

const MIME_TYPES_BY_EXTENSION: Record<string, string> = Object.fromEntries(
	Object.entries(MIME_TYPES).map(([mimeType, extension]) => [
		extension,
		mimeType,
	]),
);

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export class UploadValidationError extends Error {
	constructor(
		message: string,
		public readonly status: number,
	) {
		super(message);
		this.name = "UploadValidationError";
	}
}

function getAllowedMimeType(mimeType: string): keyof typeof MIME_TYPES | null {
	return mimeType in MIME_TYPES ? (mimeType as keyof typeof MIME_TYPES) : null;
}

export function validateUploadFile(file: { size: number; type: string }): {
	extension: (typeof MIME_TYPES)[keyof typeof MIME_TYPES];
	mimeType: keyof typeof MIME_TYPES;
} {
	const mimeType = getAllowedMimeType(file.type);
	if (!mimeType) {
		throw new UploadValidationError(
			"Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
			400,
		);
	}

	if (file.size > MAX_UPLOAD_SIZE_BYTES) {
		throw new UploadValidationError(
			"File too large. Maximum size is 5MB.",
			413,
		);
	}

	return {
		extension: MIME_TYPES[mimeType],
		mimeType,
	};
}

export function buildUploadFilename(
	mimeType: string,
	createId: () => string,
): string {
	const normalizedMimeType = getAllowedMimeType(mimeType);
	if (!normalizedMimeType) {
		throw new UploadValidationError(
			"Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
			400,
		);
	}

	return `${createId()}.${MIME_TYPES[normalizedMimeType]}`;
}

export function resolveUploadPath(
	uploadDir: string,
	requestedPath: string,
): string | null {
	if (path.isAbsolute(requestedPath)) {
		return null;
	}

	const normalizedPath = requestedPath.replace(/^[/\\]+/, "");
	if (!normalizedPath || normalizedPath === ".") {
		return null;
	}

	const resolvedUploadDir = path.resolve(uploadDir);
	const resolvedPath = path.resolve(resolvedUploadDir, normalizedPath);
	const relativePath = path.relative(resolvedUploadDir, resolvedPath);

	if (
		!relativePath ||
		relativePath.startsWith("..") ||
		path.isAbsolute(relativePath)
	) {
		return null;
	}

	return resolvedPath;
}

export function getUploadContentType(filename: string): string {
	const extension = path.extname(filename).slice(1).toLowerCase();
	return MIME_TYPES_BY_EXTENSION[extension] ?? "application/octet-stream";
}
