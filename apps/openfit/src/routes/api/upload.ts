import fs from "node:fs/promises";
import path from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import { requireAdmin } from "@/lib/auth-middleware";
import { parseSearchParams } from "@/lib/request-helpers";
import { uploadDeleteQuerySchema } from "@/lib/request-schemas";
import {
	buildUploadFilename,
	resolveUploadPath,
	UploadValidationError,
	validateUploadFile,
} from "@/lib/uploads";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
// Ensure upload directory exists
async function ensureUploadDir() {
	await fs.mkdir(UPLOAD_DIR, { recursive: true });
}
// POST /api/upload - Upload a file
// DELETE /api/upload - Delete a file
export const Route = createFileRoute("/api/upload")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				try {
					// Only admins can upload files
					await requireAdmin(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				try {
					await ensureUploadDir();
					const formData = await request.formData();
					const file = formData.get("file");
					if (!(file instanceof File)) {
						return Response.json(
							{ error: "No file provided" },
							{ status: 400 },
						);
					}
					const { mimeType } = validateUploadFile(file);
					const filename = buildUploadFilename(mimeType, nanoid);
					const filepath = resolveUploadPath(UPLOAD_DIR, filename);
					if (!filepath) {
						return Response.json(
							{ error: "Failed to prepare upload destination" },
							{ status: 500 },
						);
					}
					// Write file to disk
					const buffer = Buffer.from(await file.arrayBuffer());
					await fs.writeFile(filepath, buffer);
					return Response.json({
						path: `/api/uploads/${filename}`,
						filename,
					});
				} catch (error) {
					if (error instanceof UploadValidationError) {
						return Response.json(
							{ error: error.message },
							{ status: error.status },
						);
					}
					return Response.json(
						{ error: "Failed to upload file" },
						{ status: 500 },
					);
				}
			},
			DELETE: async ({ request }: { request: Request }) => {
				try {
					await requireAdmin(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				try {
					const { searchParams } = new URL(request.url);
					const { filename } = parseSearchParams(
						searchParams,
						uploadDeleteQuerySchema,
					);
					const filepath = resolveUploadPath(UPLOAD_DIR, filename);
					if (!filepath) {
						return Response.json(
							{ error: "Invalid filename" },
							{ status: 400 },
						);
					}
					await fs.unlink(filepath);
					return Response.json({ success: true });
				} catch (error) {
					const fileError = error as NodeJS.ErrnoException;
					if (fileError.code === "ENOENT") {
						return Response.json({ error: "File not found" }, { status: 404 });
					}
					return Response.json(
						{ error: "Failed to delete file" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
