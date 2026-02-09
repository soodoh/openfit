import { requireAdmin } from "@/lib/auth-middleware";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

export async function POST(request: NextRequest) {
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
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (SVG excluded to prevent stored XSS)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${nanoid()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    return Response.json({
      path: `/api/uploads/${filename}`,
      filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const filename = searchParams.get("filename");

    if (!filename) {
      return Response.json({ error: "No filename provided" }, { status: 400 });
    }

    // Prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filepath = path.join(UPLOAD_DIR, sanitizedFilename);

    await fs.unlink(filepath);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return Response.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
