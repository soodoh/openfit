/* eslint-disable eslint-plugin-import(prefer-default-export), oxc(no-map-spread), typescript-eslint(no-restricted-types) */
import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getOptionalSession } from "@/lib/auth-middleware";
import { and, asc, desc, eq, isNull } from "drizzle-orm";

// Helper to get first image URL for an exercise
async function getFirstImageUrl(exerciseId: string): Promise<string | null> {
  const image = await db.query.exerciseImages.findFirst({
    where: eq(schema.exerciseImages.exerciseId, exerciseId),
    orderBy: asc(schema.exerciseImages.order),
  });
  return image?.path ?? null;
}

export const Route = createFileRoute('/api/sessions/current')({
  server: {
    handlers: {
      // GET /api/sessions/current - Get the current active session
      GET: async ({ request }) => {
        const session = await getOptionalSession(request);
        if (!session) {
          return Response.json(null);
        }

        // Find most recent session without endTime
        const activeSessions = await db.query.workoutSessions.findMany({
          where: and(
            eq(schema.workoutSessions.userId, session.user.id),
            isNull(schema.workoutSessions.endTime),
          ),
          orderBy: desc(schema.workoutSessions.startTime),
          limit: 1,
        });

        if (activeSessions.length === 0) {
          return Response.json(null);
        }

        const activeSession = activeSessions[0];

        // Fetch set groups with sets and exercises
        const setGroups = await db.query.workoutSetGroups.findMany({
          where: eq(schema.workoutSetGroups.sessionId, activeSession.id),
          orderBy: asc(schema.workoutSetGroups.order),
        });

        const setGroupsWithSets = await Promise.all(
          setGroups.map(async (group) => {
            const sets = await db.query.workoutSets.findMany({
              where: eq(schema.workoutSets.setGroupId, group.id),
              orderBy: asc(schema.workoutSets.order),
              with: {
                exercise: true,
                repetitionUnit: true,
                weightUnit: true,
              },
            });

            const setsWithImages = await Promise.all(
              sets.map(async (set) => {
                const imageUrl = set.exercise
                  ? await getFirstImageUrl(set.exercise.id)
                  : null;
                return {
                  ...set,
                  exercise: set.exercise ? { ...set.exercise, imageUrl } : null,
                };
              }),
            );

            return {
              ...group,
              sets: setsWithImages,
            };
          }),
        );

        return Response.json({
          ...activeSession,
          setGroups: setGroupsWithSets,
        });
      },
    },
  },
})
