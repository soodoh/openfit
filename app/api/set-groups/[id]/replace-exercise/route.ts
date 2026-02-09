import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// POST /api/set-groups/[id]/replace-exercise - Replace exercise in all sets
export async function POST(request: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const setGroup = await db.query.workoutSetGroups.findFirst({
      where: eq(schema.workoutSetGroups.id, id),
    });

    if (!setGroup) {
      return Response.json({ error: "Set group not found" }, { status: 404 });
    }

    if (setGroup.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { exerciseId } = body;

    if (!exerciseId) {
      return Response.json(
        { error: "exerciseId is required" },
        { status: 400 },
      );
    }

    // Get all sets in this set group
    const sets = await db.query.workoutSets.findMany({
      where: eq(schema.workoutSets.setGroupId, id),
    });

    // Update each set with the new exercise
    for (const set of sets) {
      await db
        .update(schema.workoutSets)
        .set({
          exerciseId,
          updatedAt: new Date(),
        })
        .where(eq(schema.workoutSets.id, set.id));
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Replace exercise error:", error);
    return Response.json(
      { error: "Failed to replace exercise" },
      { status: 500 },
    );
  }
}
