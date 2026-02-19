import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const Route = createFileRoute('/api/set-groups')({
  server: {
    handlers: {
      // POST /api/set-groups - Create set group with sets
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
          const {
            sessionId,
            routineDayId,
            type = "NORMAL",
            exerciseId,
            numSets = 3,
          } = body;

          if (!sessionId && !routineDayId) {
            return Response.json(
              { error: "Either sessionId or routineDayId is required" },
              { status: 400 },
            );
          }

          if (!exerciseId) {
            return Response.json(
              { error: "exerciseId is required" },
              { status: 400 },
            );
          }

          // Verify ownership of the target session or routine day
          if (sessionId) {
            const workoutSession = await db.query.workoutSessions.findFirst({
              where: eq(schema.workoutSessions.id, sessionId),
            });
            if (!workoutSession || workoutSession.userId !== session.user.id) {
              return Response.json({ error: "Unauthorized" }, { status: 403 });
            }
          }

          if (routineDayId) {
            const routineDay = await db.query.routineDays.findFirst({
              where: eq(schema.routineDays.id, routineDayId),
            });
            if (!routineDay || routineDay.userId !== session.user.id) {
              return Response.json({ error: "Unauthorized" }, { status: 403 });
            }
          }

          // Get the current max order for set groups
          const existingSetGroups = sessionId
            ? await db.query.workoutSetGroups.findMany({
                where: eq(schema.workoutSetGroups.sessionId, sessionId),
              })
            : await db.query.workoutSetGroups.findMany({
                where: eq(schema.workoutSetGroups.routineDayId, routineDayId),
              });

          const maxOrder =
            existingSetGroups.length > 0
              ? Math.max(...existingSetGroups.map((g) => g.order))
              : -1;

          // Get default units
          const repUnits = await db.query.repetitionUnits.findMany({ limit: 1 });
          const weightUnits = await db.query.weightUnits.findMany({ limit: 1 });

          if (repUnits.length === 0 || weightUnits.length === 0) {
            return Response.json(
              { error: "Units not found - please seed the database first" },
              { status: 500 },
            );
          }

          // Create the set group
          const setGroupId = nanoid();
          await db.insert(schema.workoutSetGroups).values({
            id: setGroupId,
            userId: session.user.id,
            routineDayId: routineDayId || null,
            sessionId: sessionId || null,
            type,
            order: maxOrder + 1,
          });

          // Create the sets
          for (let i = 0; i < numSets; i++) {
            await db.insert(schema.workoutSets).values({
              id: nanoid(),
              userId: session.user.id,
              setGroupId,
              exerciseId,
              type: "NORMAL",
              order: i,
              reps: 10,
              repetitionUnitId: repUnits[0].id,
              weight: 0,
              weightUnitId: weightUnits[0].id,
              restTime: 0,
              completed: false,
            });
          }

          // Fetch the created set group with sets
          const setGroup = await db.query.workoutSetGroups.findFirst({
            where: eq(schema.workoutSetGroups.id, setGroupId),
          });

          const sets = await db.query.workoutSets.findMany({
            where: eq(schema.workoutSets.setGroupId, setGroupId),
            orderBy: asc(schema.workoutSets.order),
            with: {
              exercise: true,
              repetitionUnit: true,
              weightUnit: true,
            },
          });

          return Response.json({ ...setGroup, sets }, { status: 201 });
        } catch (error) {
          console.error("Create set group error:", error);
          return Response.json(
            { error: "Failed to create set group" },
            { status: 500 },
          );
        }
      },
    },
  },
})
