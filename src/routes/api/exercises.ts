import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { and, asc, eq, like } from "drizzle-orm";
import { nanoid } from "nanoid";

// Helper to get first image URL for an exercise
async function getFirstImageUrl(exerciseId: string): Promise<string | null> {
  const image = await db.query.exerciseImages.findFirst({
    where: eq(schema.exerciseImages.exerciseId, exerciseId),
    orderBy: asc(schema.exerciseImages.order),
  });
  return image?.path ?? null;
}

// Helper to add first image URL to exercises list
async function withFirstImageUrls<T extends { id: string }>(
  exercises: T[],
): Promise<(T & { imageUrl: string | null })[]> {
  const results = [];
  for (const exercise of exercises) {
    const imageUrl = await getFirstImageUrl(exercise.id);
    results.push({ ...exercise, imageUrl });
  }
  return results;
}

export const Route = createFileRoute('/api/exercises')({
  server: {
    handlers: {
      // GET /api/exercises - List exercises with pagination and filters
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);

        // Pagination
        const cursor = searchParams.get("cursor");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

        // Filters
        const searchTerm = searchParams.get("search") || "";
        const equipmentId = searchParams.get("equipmentId");
        const equipmentIds = searchParams.getAll("equipmentIds");
        const level = searchParams.get("level") as
          | "beginner"
          | "intermediate"
          | "expert"
          | null;
        const categoryId = searchParams.get("categoryId");
        const primaryMuscleId = searchParams.get("primaryMuscleId");

        // Build query conditions
        const conditions: ReturnType<typeof eq>[] = [];

        if (equipmentId) {
          conditions.push(eq(schema.exercises.equipmentId, equipmentId));
        }
        if (level) {
          conditions.push(eq(schema.exercises.level, level));
        }
        if (categoryId) {
          conditions.push(eq(schema.exercises.categoryId, categoryId));
        }
        if (searchTerm) {
          conditions.push(like(schema.exercises.name, `%${searchTerm}%`));
        }

        // Get exercises
        let exercises = await db.query.exercises.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          orderBy: asc(schema.exercises.name),
          limit: limit + 1,
          offset: cursor ? parseInt(cursor) : 0,
          with: {
            equipment: true,
            category: true,
            primaryMuscles: {
              with: {
                muscleGroup: true,
              },
            },
          },
        });

        // Apply client-side filtering for primaryMuscleId and equipmentIds
        if (primaryMuscleId) {
          exercises = exercises.filter((e) =>
            e.primaryMuscles.some((pm) => pm.muscleGroupId === primaryMuscleId),
          );
        }
        if (equipmentIds.length > 0) {
          exercises = exercises.filter((e) => {
            // Bodyweight exercises (no equipment) are always included
            if (!e.equipmentId) return true;
            return equipmentIds.includes(e.equipmentId);
          });
        }

        // Check if there are more results
        const hasMore = exercises.length > limit;
        if (hasMore) {
          exercises = exercises.slice(0, limit);
        }

        // Add image URLs
        const exercisesWithImages = await withFirstImageUrls(exercises);

        // Transform to match expected format
        const page = exercisesWithImages.map((e) => ({
          ...e,
          primaryMuscleIds: e.primaryMuscles.map((pm) => pm.muscleGroupId),
          secondaryMuscleIds: [], // Will be populated if needed
        }));

        return Response.json({
          page,
          isDone: !hasMore,
          continueCursor: hasMore
            ? String((cursor ? parseInt(cursor) : 0) + limit)
            : null,
        });
      },

      // POST /api/exercises - Create exercise (admin only)
      POST: async ({ request }) => {
        try {
          await requireAdmin(request);
        } catch (error) {
          if (error instanceof Response) return error;
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const body = await request.json();
          const {
            name,
            equipmentId,
            force,
            level,
            mechanic,
            categoryId,
            primaryMuscleIds = [],
            secondaryMuscleIds = [],
            instructions = [],
          } = body;

          if (!name || !categoryId) {
            return Response.json(
              { error: "Name and category are required" },
              { status: 400 },
            );
          }

          // Create exercise
          const exerciseId = nanoid();
          await db.insert(schema.exercises).values({
            id: exerciseId,
            name,
            equipmentId: equipmentId || null,
            force: force || null,
            level: level || "beginner",
            mechanic: mechanic || null,
            categoryId,
          });

          // Create primary muscles
          for (const muscleGroupId of primaryMuscleIds) {
            await db.insert(schema.exercisePrimaryMuscles).values({
              id: nanoid(),
              exerciseId,
              muscleGroupId,
            });
          }

          // Create secondary muscles
          for (const muscleGroupId of secondaryMuscleIds) {
            await db.insert(schema.exerciseSecondaryMuscles).values({
              id: nanoid(),
              exerciseId,
              muscleGroupId,
            });
          }

          // Create instructions
          for (let i = 0; i < instructions.length; i++) {
            await db.insert(schema.exerciseInstructions).values({
              id: nanoid(),
              exerciseId,
              order: i,
              instruction: instructions[i],
            });
          }

          // Fetch the created exercise with relations
          const exercise = await db.query.exercises.findFirst({
            where: eq(schema.exercises.id, exerciseId),
            with: {
              equipment: true,
              category: true,
              primaryMuscles: { with: { muscleGroup: true } },
              secondaryMuscles: { with: { muscleGroup: true } },
              instructions: { orderBy: asc(schema.exerciseInstructions.order) },
            },
          });

          return Response.json(exercise, { status: 201 });
        } catch (error) {
          console.error("Create exercise error:", error);
          return Response.json(
            { error: "Failed to create exercise" },
            { status: 500 },
          );
        }
      },
    },
  },
})
