import fs from "fs/promises";
import { NextRequest } from "next/server";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathParts } = await params;
    const filename = pathParts.join("/");

    // Prevent directory traversal
    const sanitizedPath = path
      .normalize(filename)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    const filepath = path.join(UPLOAD_DIR, sanitizedPath);

    // Ensure the file is within the upload directory
    if (!filepath.startsWith(UPLOAD_DIR)) {
      return new Response("Not found", { status: 404 });
    }

    const buffer = await fs.readFile(filepath);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
