import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/sets/[id] - Update set
export async function PATCH(request: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const set = await db.query.workoutSets.findFirst({
      where: eq(schema.workoutSets.id, id),
    });

    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 });
    }

    if (set.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      type,
      reps,
      repetitionUnitId,
      weight,
      weightUnitId,
      restTime,
      completed,
    } = body;

    await db
      .update(schema.workoutSets)
      .set({
        ...(type !== undefined && { type }),
        ...(reps !== undefined && { reps }),
        ...(repetitionUnitId !== undefined && { repetitionUnitId }),
        ...(weight !== undefined && { weight }),
        ...(weightUnitId !== undefined && { weightUnitId }),
        ...(restTime !== undefined && { restTime }),
        ...(completed !== undefined && { completed }),
        updatedAt: new Date(),
      })
      .where(eq(schema.workoutSets.id, id));

    const updated = await db.query.workoutSets.findFirst({
      where: eq(schema.workoutSets.id, id),
      with: {
        exercise: true,
        repetitionUnit: true,
        weightUnit: true,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Update set error:", error);
    return Response.json({ error: "Failed to update set" }, { status: 500 });
  }
}

// DELETE /api/sets/[id] - Delete set (also deletes set group if last set)
export async function DELETE(request: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const set = await db.query.workoutSets.findFirst({
      where: eq(schema.workoutSets.id, id),
    });

    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 });
    }

    if (set.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const setGroupId = set.setGroupId;

    // Delete the set
    await db.delete(schema.workoutSets).where(eq(schema.workoutSets.id, id));

    // Check if there are any remaining sets in the set group
    const remainingSets = await db.query.workoutSets.findFirst({
      where: eq(schema.workoutSets.setGroupId, setGroupId),
    });

    // If no remaining sets, delete the set group
    if (!remainingSets) {
      await db
        .delete(schema.workoutSetGroups)
        .where(eq(schema.workoutSetGroups.id, setGroupId));
      return Response.json({ success: true, setGroupDeleted: true });
    }

    return Response.json({ success: true, setGroupDeleted: false });
  } catch (error) {
    console.error("Delete set error:", error);
    return Response.json({ error: "Failed to delete set" }, { status: 500 });
  }
}
