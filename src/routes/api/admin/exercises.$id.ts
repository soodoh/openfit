/* eslint-disable eslint(no-console), eslint-plugin-import(prefer-default-export) */
import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import {
  exerciseImages,
  exerciseInstructions,
  exercisePrimaryMuscles,
  exercises,
  exerciseSecondaryMuscles,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

export const Route = createFileRoute('/api/admin/exercises/$id')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          await requireAdmin(request);
          const { id } = params;
          const body = await request.json();

          // Update exercise
          await db
            .update(exercises)
            .set({
              name: body.name,
              level: body.level,
              force: body.force,
              mechanic: body.mechanic,
              equipmentId: body.equipmentId,
              categoryId: body.categoryId,
            })
            .where(eq(exercises.id, id));

          // Update primary muscles
          if (body.primaryMuscleIds !== undefined) {
            await db
              .delete(exercisePrimaryMuscles)
              .where(eq(exercisePrimaryMuscles.exerciseId, id));

            if (body.primaryMuscleIds.length > 0) {
              await db.insert(exercisePrimaryMuscles).values(
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
              .delete(exerciseSecondaryMuscles)
              .where(eq(exerciseSecondaryMuscles.exerciseId, id));

            if (body.secondaryMuscleIds.length > 0) {
              await db.insert(exerciseSecondaryMuscles).values(
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
              .delete(exerciseInstructions)
              .where(eq(exerciseInstructions.exerciseId, id));

            if (body.instructions.length > 0) {
              await db.insert(exerciseInstructions).values(
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
            await db.delete(exerciseImages).where(eq(exerciseImages.exerciseId, id));

            if (body.imageUrls.length > 0) {
              await db.insert(exerciseImages).values(
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
          console.error("Error updating exercise:", error);
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
            .delete(exercisePrimaryMuscles)
            .where(eq(exercisePrimaryMuscles.exerciseId, id));
          await db
            .delete(exerciseSecondaryMuscles)
            .where(eq(exerciseSecondaryMuscles.exerciseId, id));
          await db
            .delete(exerciseInstructions)
            .where(eq(exerciseInstructions.exerciseId, id));
          await db.delete(exerciseImages).where(eq(exerciseImages.exerciseId, id));

          // Delete exercise
          await db.delete(exercises).where(eq(exercises.id, id));

          return Response.json({ success: true });
        } catch (error) {
          console.error("Error deleting exercise:", error);
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
})
