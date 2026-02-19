import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { asc, like } from "drizzle-orm";

// Helper to get first image URL for an exercise
async function getFirstImageUrl(exerciseId: string): Promise<string | null> {
  const image = await db.query.exerciseImages.findFirst({
    where: (images, { eq }) => eq(images.exerciseId, exerciseId),
    orderBy: asc(schema.exerciseImages.order),
  });
  return image?.path ?? null;
}

export const Route = createFileRoute('/api/exercises/similar')({
  server: {
    handlers: {
      // GET /api/exercises/similar - Search for similar exercises
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);

        const searchTerm = searchParams.get("q") || "";
        const equipmentIds = searchParams.getAll("equipmentIds");
        const primaryMuscleIds = searchParams.getAll("primaryMuscleIds");
        const excludeExerciseId = searchParams.get("exclude");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

        if (primaryMuscleIds.length === 0) {
          return Response.json([]);
        }

        // Build query
        let exercises = await db.query.exercises.findMany({
          where: searchTerm
            ? like(schema.exercises.name, `%${searchTerm}%`)
            : undefined,
          orderBy: asc(schema.exercises.name),
          limit: 100, // Fetch more for filtering
          with: {
            primaryMuscles: true,
          },
        });

        // Filter by primary muscles - must share at least one
        exercises = exercises.filter((e) => {
          // Exclude the current exercise
          if (excludeExerciseId && e.id === excludeExerciseId) {
            return false;
          }
          // Must share at least one primary muscle
          return e.primaryMuscles.some((pm) =>
            primaryMuscleIds.includes(pm.muscleGroupId),
          );
        });

        // Apply equipment filter if provided
        // Bodyweight exercises (no equipment) are always included
        if (equipmentIds.length > 0) {
          exercises = exercises.filter((e) => {
            if (!e.equipmentId) return true;
            return equipmentIds.includes(e.equipmentId);
          });
        }

        // Limit results
        exercises = exercises.slice(0, limit);

        // Add image URLs
        const results = [];
        for (const exercise of exercises) {
          const imageUrl = await getFirstImageUrl(exercise.id);
          results.push({
            ...exercise,
            imageUrl,
            primaryMuscleIds: exercise.primaryMuscles.map((pm) => pm.muscleGroupId),
          });
        }

        return Response.json(results);
      },
    },
  },
})
