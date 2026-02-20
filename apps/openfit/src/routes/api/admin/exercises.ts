import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { createId } from "@paralleldrive/cuid2";
import { asc, count, like } from "drizzle-orm";
export const Route = createFileRoute("/api/admin/exercises")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
          const { searchParams } = new URL(request.url);
          const page = Math.max(1, Number(searchParams.get("page")) || 1);
          const pageSize = Math.max(
            1,
            Number(searchParams.get("pageSize")) || 10,
          );
          const search = searchParams.get("search")?.trim() || "";
          const conditions = search
            ? like(schema.exercises.name, `%${search}%`)
            : undefined;
          const [totalResult] = await db
            .select({ count: count() })
            .from(schema.exercises)
            .where(conditions);
          const allExercises = await db.query.exercises.findMany({
            with: {
              equipment: true,
              category: true,
              primaryMuscles: {
                with: {
                  muscleGroup: true,
                },
              },
              secondaryMuscles: {
                with: {
                  muscleGroup: true,
                },
              },
              instructions: {
                orderBy: [asc(schema.exerciseInstructions.order)],
              },
              images: {
                orderBy: [asc(schema.exerciseImages.order)],
              },
            },
            where: conditions,
            orderBy: [asc(schema.exercises.name)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
          });
          // Transform to match expected format
          const formatted = allExercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            level: ex.level,
            force: ex.force,
            mechanic: ex.mechanic,
            equipmentId: ex.equipmentId,
            categoryId: ex.categoryId,
            primaryMuscleIds: ex.primaryMuscles.map((pm) => pm.muscleGroupId),
            secondaryMuscleIds: ex.secondaryMuscles.map(
              (sm) => sm.muscleGroupId,
            ),
            instructions: ex.instructions.map((i) => i.instruction),
            imageUrls: ex.images.map((i) => i.path),
            equipment: ex.equipment
              ? { id: ex.equipment.id, name: ex.equipment.name }
              : null,
            category: ex.category
              ? { id: ex.category.id, name: ex.category.name }
              : null,
            primaryMuscles: ex.primaryMuscles.map((pm) => ({
              id: pm.muscleGroup.id,
              name: pm.muscleGroup.name,
            })),
            secondaryMuscles: ex.secondaryMuscles.map((sm) => ({
              id: sm.muscleGroup.id,
              name: sm.muscleGroup.name,
            })),
          }));
          return Response.json({
            items: formatted,
            total: totalResult.count,
            page,
            pageSize,
          });
        } catch (error) {
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to fetch exercises" },
            { status: 500 },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          await requireAdmin(request);
          const body = await request.json();
          const exerciseId = createId();
          // Create exercise
          await db.insert(schema.exercises).values({
            id: exerciseId,
            name: body.name,
            level: body.level,
            force: body.force,
            mechanic: body.mechanic,
            equipmentId: body.equipmentId,
            categoryId: body.categoryId,
          });
          // Add primary muscles
          if (body.primaryMuscleIds?.length) {
            await db.insert(schema.exercisePrimaryMuscles).values(
              body.primaryMuscleIds.map((muscleId: string) => ({
                id: createId(),
                exerciseId,
                muscleGroupId: muscleId,
              })),
            );
          }
          // Add secondary muscles
          if (body.secondaryMuscleIds?.length) {
            await db.insert(schema.exerciseSecondaryMuscles).values(
              body.secondaryMuscleIds.map((muscleId: string) => ({
                id: createId(),
                exerciseId,
                muscleGroupId: muscleId,
              })),
            );
          }
          // Add instructions
          if (body.instructions?.length) {
            await db.insert(schema.exerciseInstructions).values(
              body.instructions.map((instruction: string, index: number) => ({
                id: createId(),
                exerciseId,
                instruction,
                order: index,
              })),
            );
          }
          // Add images
          if (body.imageUrls?.length) {
            await db.insert(schema.exerciseImages).values(
              body.imageUrls.map((imagePath: string, index: number) => ({
                id: createId(),
                exerciseId,
                path: imagePath,
                order: index,
              })),
            );
          }
          return Response.json({ id: exerciseId });
        } catch (error) {
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to create exercise" },
            { status: 500 },
          );
        }
      },
    },
  },
});

export default Route;
