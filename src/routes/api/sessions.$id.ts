import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { asc, eq } from "drizzle-orm";
// Helper to get first image URL for an exercise
async function getFirstImageUrl(
  exerciseId: string,
): Promise<string | undefined> {
  const image = await db.query.exerciseImages.findFirst({
    where: eq(schema.exerciseImages.exerciseId, exerciseId),
    orderBy: asc(schema.exerciseImages.order),
  });
  return image?.path ?? undefined;
}
// Helper to get session with full data
async function getSessionWithData(sessionId: string) {
  const session = await db.query.workoutSessions.findFirst({
    where: eq(schema.workoutSessions.id, sessionId),
  });
  if (!session) {
    return null;
  }
  const setGroups = await db.query.workoutSetGroups.findMany({
    where: eq(schema.workoutSetGroups.sessionId, sessionId),
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
          return Object.assign(set, {
            exercise: set.exercise ? { ...set.exercise, imageUrl } : null,
          });
        }),
      );
      return Object.assign(group, {
        sets: setsWithImages,
      });
    }),
  );
  return {
    ...session,
    setGroups: setGroupsWithSets,
  };
}
export const Route = createFileRoute("/api/sessions/$id")({
  server: {
    handlers: {
      // GET /api/sessions/[id] - Get single session
      GET: async ({ request, params }) => {
        let authSession;
        try {
          authSession = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {
            return error;
          }
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = params;
        const session = await db.query.workoutSessions.findFirst({
          where: eq(schema.workoutSessions.id, id),
        });
        if (!session) {
          return Response.json({ error: "Session not found" }, { status: 404 });
        }
        if (session.userId !== authSession.user.id) {
          return Response.json({ error: "Unauthorized" }, { status: 403 });
        }
        const sessionWithData = await getSessionWithData(id);
        return Response.json(sessionWithData);
      },
      // PATCH /api/sessions/[id] - Update session
      PATCH: async ({ request, params }) => {
        let authSession;
        try {
          authSession = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {
            return error;
          }
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = params;
        try {
          const session = await db.query.workoutSessions.findFirst({
            where: eq(schema.workoutSessions.id, id),
          });
          if (!session) {
            return Response.json(
              { error: "Session not found" },
              { status: 404 },
            );
          }
          if (session.userId !== authSession.user.id) {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
          }
          const body = await request.json();
          const { name, notes, impression, startTime, endTime } = body;
          await db
            .update(schema.workoutSessions)
            .set({
              ...(name !== undefined && { name: name.trim() }),
              ...(notes !== undefined && { notes: notes.trim() }),
              ...(impression !== undefined && { impression }),
              ...(startTime !== undefined && {
                startTime: new Date(startTime),
              }),
              ...(endTime !== undefined && {
                endTime: endTime ? new Date(endTime) : null,
              }),
              updatedAt: new Date(),
            })
            .where(eq(schema.workoutSessions.id, id));
          const updated = await getSessionWithData(id);
          return Response.json(updated);
        } catch {
          return Response.json(
            { error: "Failed to update session" },
            { status: 500 },
          );
        }
      },
      // DELETE /api/sessions/[id] - Delete session (cascades)
      DELETE: async ({ request, params }) => {
        let authSession;
        try {
          authSession = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {
            return error;
          }
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = params;
        try {
          const session = await db.query.workoutSessions.findFirst({
            where: eq(schema.workoutSessions.id, id),
          });
          if (!session) {
            return Response.json(
              { error: "Session not found" },
              { status: 404 },
            );
          }
          if (session.userId !== authSession.user.id) {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
          }
          // Delete session (cascades to set groups, sets via FK)
          await db
            .delete(schema.workoutSessions)
            .where(eq(schema.workoutSessions.id, id));
          return Response.json({ success: true });
        } catch {
          return Response.json(
            { error: "Failed to delete session" },
            { status: 500 },
          );
        }
      },
    },
  },
});
export default Route;
