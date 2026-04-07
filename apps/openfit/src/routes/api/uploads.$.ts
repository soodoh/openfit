import fs from "node:fs/promises";
import path from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { getUploadContentType, resolveUploadPath } from "@/lib/uploads";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export const Route = createFileRoute("/api/uploads/$")({
	server: {
		handlers: {
			GET: async ({ params }: { params: Record<string, string> }) => {
				try {
					const filename = params._splat;
					const filepath = resolveUploadPath(UPLOAD_DIR, filename);
					if (!filepath) {
						return new Response("Not found", { status: 404 });
					}
					const buffer = await fs.readFile(filepath);
					const contentType = getUploadContentType(filename);
					return new Response(buffer, {
						headers: {
							"Content-Type": contentType,
							"Cache-Control": "public, max-age=31536000, immutable",
						},
					});
				} catch {
					return new Response("Not found", { status: 404 });
				}
			},
		},
	},
});

export default Route;
