/* eslint-disable eslint(radix), eslint-plugin-import(prefer-default-export), typescript-eslint(no-restricted-types) */
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

export const Route = createFileRoute('/api/exercises/search')({
  server: {
    handlers: {
      // GET /api/exercises/search - Simple search for autocomplete
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url);

        const searchTerm = searchParams.get("q") || "";
        const equipmentIds = searchParams.getAll("equipmentIds");
        const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 50);

        // Build query
        let exercises = await db.query.exercises.findMany({
          where: searchTerm
            ? like(schema.exercises.name, `%${searchTerm}%`)
            : undefined,
          orderBy: asc(schema.exercises.name),
          limit: 50, // Fetch more for filtering
          with: {
            primaryMuscles: true,
          },
        });

        // Apply equipment filter if provided
        // Bodyweight exercises (no equipment) are always included
        if (equipmentIds.length > 0) {
          exercises = exercises.filter((e) => {
            if (!e.equipmentId) {return true;}
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
