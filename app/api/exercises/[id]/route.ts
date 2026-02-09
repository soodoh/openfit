import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/exercises/[id] - Get single exercise
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const exercise = await db.query.exercises.findFirst({
    where: eq(schema.exercises.id, id),
    with: {
      equipment: true,
      category: true,
      primaryMuscles: { with: { muscleGroup: true } },
      secondaryMuscles: { with: { muscleGroup: true } },
      instructions: { orderBy: asc(schema.exerciseInstructions.order) },
      images: { orderBy: asc(schema.exerciseImages.order) },
    },
  });

  if (!exercise) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  // Transform to expected format
  const result = {
    ...exercise,
    primaryMuscleIds: exercise.primaryMuscles.map((pm) => pm.muscleGroupId),
    secondaryMuscleIds: exercise.secondaryMuscles.map((sm) => sm.muscleGroupId),
    instructions: exercise.instructions.map((i) => i.instruction),
    imageUrls: exercise.images.map((img) => img.path),
  };

  return Response.json(result);
}

// PATCH /api/exercises/[id] - Update exercise (admin only)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      name,
      equipmentId,
      force,
      level,
      mechanic,
      categoryId,
      primaryMuscleIds,
      secondaryMuscleIds,
      instructions,
    } = body;

    // Check if exercise exists
    const existing = await db.query.exercises.findFirst({
      where: eq(schema.exercises.id, id),
    });

    if (!existing) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Update exercise
    await db
      .update(schema.exercises)
      .set({
        ...(name !== undefined && { name }),
        ...(equipmentId !== undefined && { equipmentId: equipmentId || null }),
        ...(force !== undefined && { force: force || null }),
        ...(level !== undefined && { level }),
        ...(mechanic !== undefined && { mechanic: mechanic || null }),
        ...(categoryId !== undefined && { categoryId }),
        updatedAt: new Date(),
      })
      .where(eq(schema.exercises.id, id));

    // Update primary muscles if provided
    if (primaryMuscleIds !== undefined) {
      await db
        .delete(schema.exercisePrimaryMuscles)
        .where(eq(schema.exercisePrimaryMuscles.exerciseId, id));

      for (const muscleGroupId of primaryMuscleIds) {
        await db.insert(schema.exercisePrimaryMuscles).values({
          id: nanoid(),
          exerciseId: id,
          muscleGroupId,
        });
      }
    }

    // Update secondary muscles if provided
    if (secondaryMuscleIds !== undefined) {
      await db
        .delete(schema.exerciseSecondaryMuscles)
        .where(eq(schema.exerciseSecondaryMuscles.exerciseId, id));

      for (const muscleGroupId of secondaryMuscleIds) {
        await db.insert(schema.exerciseSecondaryMuscles).values({
          id: nanoid(),
          exerciseId: id,
          muscleGroupId,
        });
      }
    }

    // Update instructions if provided
    if (instructions !== undefined) {
      await db
        .delete(schema.exerciseInstructions)
        .where(eq(schema.exerciseInstructions.exerciseId, id));

      for (let i = 0; i < instructions.length; i++) {
        await db.insert(schema.exerciseInstructions).values({
          id: nanoid(),
          exerciseId: id,
          order: i,
          instruction: instructions[i],
        });
      }
    }

    // Fetch updated exercise
    const updated = await db.query.exercises.findFirst({
      where: eq(schema.exercises.id, id),
      with: {
        equipment: true,
        category: true,
        primaryMuscles: { with: { muscleGroup: true } },
        secondaryMuscles: { with: { muscleGroup: true } },
        instructions: { orderBy: asc(schema.exerciseInstructions.order) },
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Update exercise error:", error);
    return Response.json(
      { error: "Failed to update exercise" },
      { status: 500 },
    );
  }
}

// DELETE /api/exercises/[id] - Delete exercise (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if exercise exists
    const existing = await db.query.exercises.findFirst({
      where: eq(schema.exercises.id, id),
    });

    if (!existing) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Delete exercise (cascades to related tables)
    await db.delete(schema.exercises).where(eq(schema.exercises.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete exercise error:", error);
    return Response.json(
      { error: "Failed to delete exercise" },
      { status: 500 },
    );
  }
}
