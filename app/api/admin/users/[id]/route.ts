import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const updated = await db
      .update(userProfiles)
      .set({ role: body.role })
      .where(eq(userProfiles.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
