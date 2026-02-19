import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

// Helper to get first image URL for an exercise
async function getFirstImageUrl(exerciseId: string): Promise<string | null> {
  const image = await db.query.exerciseImages.findFirst({
    where: eq(schema.exerciseImages.exerciseId, exerciseId),
    orderBy: asc(schema.exerciseImages.order),
  });
  return image?.path ?? null;
}

// Helper to get session with full data
async function getSessionWithData(sessionId: string) {
  const session = await db.query.workoutSessions.findFirst({
    where: eq(schema.workoutSessions.id, sessionId),
  });

  if (!session) return null;

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

  return {
    ...session,
    setGroups: setGroupsWithSets,
  };
}

export const Route = createFileRoute('/api/sessions')({
  server: {
    handlers: {
      // GET /api/sessions - List sessions
      GET: async ({ request }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) return error;
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build query conditions
        const conditions = [eq(schema.workoutSessions.userId, session.user.id)];

        if (startDate && endDate) {
          conditions.push(
            gte(schema.workoutSessions.startTime, new Date(parseInt(startDate))),
          );
          conditions.push(
            lt(schema.workoutSessions.startTime, new Date(parseInt(endDate))),
          );
        }

        const sessions = await db.query.workoutSessions.findMany({
          where: and(...conditions),
          orderBy: desc(schema.workoutSessions.startTime),
        });

        // If date range specified, return minimal data for calendar
        if (startDate && endDate) {
          return Response.json(
            sessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              name: s.name,
              startTime: s.startTime,
              endTime: s.endTime,
              impression: s.impression,
            })),
          );
        }

        // Otherwise return full data
        const sessionsWithData = await Promise.all(
          sessions.map(async (s) => getSessionWithData(s.id)),
        );

        return Response.json(sessionsWithData);
      },

      // POST /api/sessions - Create session
      POST: async ({ request }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) return error;
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const body = await request.json();
          const { name, notes, startTime, endTime, impression, templateId } = body;

          // If templateId provided, fetch the template
          let routineDay = null;
          if (templateId) {
            routineDay = await db.query.routineDays.findFirst({
              where: eq(schema.routineDays.id, templateId),
            });
            if (!routineDay) {
              return Response.json({ error: "Template not found" }, { status: 404 });
            }
            if (routineDay.userId !== session.user.id) {
              return Response.json({ error: "Unauthorized" }, { status: 403 });
            }
          }

          // Derive session name from template if not provided
          const sessionName = (name?.trim() || routineDay?.description || "").trim();

          // Create the session
          const sessionId = nanoid();
          await db.insert(schema.workoutSessions).values({
            id: sessionId,
            userId: session.user.id,
            name: sessionName,
            notes: notes?.trim() || "",
            startTime: startTime ? new Date(startTime) : new Date(),
            endTime: endTime ? new Date(endTime) : null,
            impression,
            templateId: templateId || null,
          });

          // If no template, return the session
          if (!routineDay) {
            const created = await getSessionWithData(sessionId);
            return Response.json(created, { status: 201 });
          }

          // Clone sets from routine day template
          const setGroups = await db.query.workoutSetGroups.findMany({
            where: eq(schema.workoutSetGroups.routineDayId, templateId),
            orderBy: asc(schema.workoutSetGroups.order),
          });

          // Clone each set group
          for (const [setGroupOrder, setGroupTemplate] of setGroups.entries()) {
            const newSetGroupId = nanoid();
            await db.insert(schema.workoutSetGroups).values({
              id: newSetGroupId,
              userId: session.user.id,
              sessionId,
              routineDayId: null,
              type: setGroupTemplate.type,
              order: setGroupOrder,
              comment: setGroupTemplate.comment,
            });

            // Clone sets in this set group
            const sets = await db.query.workoutSets.findMany({
              where: eq(schema.workoutSets.setGroupId, setGroupTemplate.id),
              orderBy: asc(schema.workoutSets.order),
            });

            for (const [setOrder, setTemplate] of sets.entries()) {
              await db.insert(schema.workoutSets).values({
                id: nanoid(),
                userId: session.user.id,
                setGroupId: newSetGroupId,
                exerciseId: setTemplate.exerciseId,
                order: setOrder,
                type: setTemplate.type,
                weight: setTemplate.weight,
                weightUnitId: setTemplate.weightUnitId,
                reps: setTemplate.reps,
                repetitionUnitId: setTemplate.repetitionUnitId,
                restTime: setTemplate.restTime,
                completed: false,
              });
            }
          }

          const created = await getSessionWithData(sessionId);
          return Response.json(created, { status: 201 });
        } catch (error) {
          console.error("Create session error:", error);
          return Response.json(
            { error: "Failed to create session" },
            { status: 500 },
          );
        }
      },
    },
  },
})
