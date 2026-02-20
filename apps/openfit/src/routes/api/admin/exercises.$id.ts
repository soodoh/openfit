import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
export const Route = createFileRoute("/api/admin/exercises/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          await requireAdmin(request);
          const { id } = params;
          const body = await request.json();
          // Update exercise
          await db
            .update(schema.exercises)
            .set({
              name: body.name,
              level: body.level,
              force: body.force,
              mechanic: body.mechanic,
              equipmentId: body.equipmentId,
              categoryId: body.categoryId,
            })
            .where(eq(schema.exercises.id, id));
          // Update primary muscles
          if (body.primaryMuscleIds !== undefined) {
            await db
              .delete(schema.exercisePrimaryMuscles)
              .where(eq(schema.exercisePrimaryMuscles.exerciseId, id));
            if (body.primaryMuscleIds.length > 0) {
              await db.insert(schema.exercisePrimaryMuscles).values(
                body.primaryMuscleIds.map((muscleId: string) => ({
                  id: createId(),
                  exerciseId: id,
                  muscleGroupId: muscleId,
                })),
              );
            }
          }
          // Update secondary muscles
          if (body.secondaryMuscleIds !== undefined) {
            await db
              .delete(schema.exerciseSecondaryMuscles)
              .where(eq(schema.exerciseSecondaryMuscles.exerciseId, id));
            if (body.secondaryMuscleIds.length > 0) {
              await db.insert(schema.exerciseSecondaryMuscles).values(
                body.secondaryMuscleIds.map((muscleId: string) => ({
                  id: createId(),
                  exerciseId: id,
                  muscleGroupId: muscleId,
                })),
              );
            }
          }
          // Update instructions
          if (body.instructions !== undefined) {
            await db
              .delete(schema.exerciseInstructions)
              .where(eq(schema.exerciseInstructions.exerciseId, id));
            if (body.instructions.length > 0) {
              await db.insert(schema.exerciseInstructions).values(
                body.instructions.map((instruction: string, index: number) => ({
                  id: createId(),
                  exerciseId: id,
                  instruction,
                  order: index,
                })),
              );
            }
          }
          // Update images
          if (body.imageUrls !== undefined) {
            await db
              .delete(schema.exerciseImages)
              .where(eq(schema.exerciseImages.exerciseId, id));
            if (body.imageUrls.length > 0) {
              await db.insert(schema.exerciseImages).values(
                body.imageUrls.map((imagePath: string, index: number) => ({
                  id: createId(),
                  exerciseId: id,
                  imagePath,
                  order: index,
                })),
              );
            }
          }
          return Response.json({ success: true });
        } catch (error) {
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to update exercise" },
            { status: 500 },
          );
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          await requireAdmin(request);
          const { id } = params;
          // Delete related records first (cascading)
          await db
            .delete(schema.exercisePrimaryMuscles)
            .where(eq(schema.exercisePrimaryMuscles.exerciseId, id));
          await db
            .delete(schema.exerciseSecondaryMuscles)
            .where(eq(schema.exerciseSecondaryMuscles.exerciseId, id));
          await db
            .delete(schema.exerciseInstructions)
            .where(eq(schema.exerciseInstructions.exerciseId, id));
          await db
            .delete(schema.exerciseImages)
            .where(eq(schema.exerciseImages.exerciseId, id));
          // Delete exercise
          await db.delete(schema.exercises).where(eq(schema.exercises.id, id));
          return Response.json({ success: true });
        } catch (error) {
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to delete exercise" },
            { status: 500 },
          );
        }
      },
    },
  },
});

export default Route;
