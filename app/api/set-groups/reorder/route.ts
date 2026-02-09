import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

// POST /api/set-groups/reorder - Reorder set groups
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { setGroupIds } = body;

    if (!Array.isArray(setGroupIds)) {
      return Response.json(
        { error: "setGroupIds must be an array" },
        { status: 400 },
      );
    }

    // Update the order for each set group
    for (const [index, setGroupId] of setGroupIds.entries()) {
      const setGroup = await db.query.workoutSetGroups.findFirst({
        where: eq(schema.workoutSetGroups.id, setGroupId),
      });

      if (!setGroup) continue;

      if (setGroup.userId !== session.user.id) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
      }

      await db
        .update(schema.workoutSetGroups)
        .set({
          order: index,
          updatedAt: new Date(),
        })
        .where(eq(schema.workoutSetGroups.id, setGroupId));
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Reorder set groups error:", error);
    return Response.json(
      { error: "Failed to reorder set groups" },
      { status: 500 },
    );
  }
}
