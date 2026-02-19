import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, isNotNull } from "drizzle-orm";

// GET /api/dashboard/recent-sessions - Get recent completed sessions
export const Route = createFileRoute("/api/dashboard/recent-sessions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) return error;
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get recent completed sessions with their set groups and exercises
        const sessions = await db.query.workoutSessions.findMany({
          where: and(
            eq(schema.workoutSessions.userId, session.user.id),
            isNotNull(schema.workoutSessions.endTime),
          ),
          orderBy: [desc(schema.workoutSessions.startTime)],
          limit: 6,
          with: {
            setGroups: {
              orderBy: [schema.workoutSetGroups.order],
              with: {
                sets: {
                  orderBy: [schema.workoutSets.order],
                  with: {
                    exercise: true,
                  },
                },
              },
            },
          },
        });

        // Transform to expected format
        const result = sessions.map((s) => ({
          id: s.id,
          _id: s.id, // Compatibility with old Convex format
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          impression: s.impression,
          setGroups: s.setGroups.map((sg) => ({
            id: sg.id,
            _id: sg.id,
            type: sg.type,
            order: sg.order,
            sets: sg.sets.map((set) => ({
              id: set.id,
              _id: set.id,
              exerciseId: set.exerciseId,
              exercise: set.exercise
                ? {
                    id: set.exercise.id,
                    _id: set.exercise.id,
                    name: set.exercise.name,
                    imageUrl: null, // Images not loaded in this query for performance
                  }
                : null,
            })),
          })),
        }));

        return Response.json(result);
      },
    },
  },
});
