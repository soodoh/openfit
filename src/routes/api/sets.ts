import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const Route = createFileRoute('/api/sets')({
  server: {
    handlers: {
      // POST /api/sets - Create a new set
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
            setGroupId,
            exerciseId,
            type = "NORMAL",
            reps,
            repetitionUnitId,
            weight,
            weightUnitId,
            restTime,
          } = body;

          if (!setGroupId || !exerciseId) {
            return Response.json(
              { error: "setGroupId and exerciseId are required" },
              { status: 400 },
            );
          }

          // Verify set group ownership
          const setGroup = await db.query.workoutSetGroups.findFirst({
            where: eq(schema.workoutSetGroups.id, setGroupId),
          });

          if (!setGroup || setGroup.userId !== session.user.id) {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
          }

          // Determine if set should be auto-completed
          let shouldAutoComplete = false;
          if (setGroup.sessionId) {
            const workoutSession = await db.query.workoutSessions.findFirst({
              where: eq(schema.workoutSessions.id, setGroup.sessionId),
            });
            if (workoutSession?.endTime) {
              shouldAutoComplete = true;
            }
          }

          // Get current max order for sets in this group
          const existingSets = await db.query.workoutSets.findMany({
            where: eq(schema.workoutSets.setGroupId, setGroupId),
          });

          const maxOrder =
            existingSets.length > 0
              ? Math.max(...existingSets.map((s) => s.order))
              : -1;

          // Get default units if not provided
          const repUnits = await db.query.repetitionUnits.findMany({ limit: 1 });
          const weightUnits = await db.query.weightUnits.findMany({ limit: 1 });

          const setId = nanoid();
          await db.insert(schema.workoutSets).values({
            id: setId,
            userId: session.user.id,
            setGroupId,
            exerciseId,
            type,
            order: maxOrder + 1,
            reps: reps ?? 10,
            repetitionUnitId: repetitionUnitId || repUnits[0]?.id,
            weight: weight ?? 0,
            weightUnitId: weightUnitId || weightUnits[0]?.id,
            restTime: restTime ?? 0,
            completed: shouldAutoComplete,
          });

          const created = await db.query.workoutSets.findFirst({
            where: eq(schema.workoutSets.id, setId),
            with: {
              exercise: true,
              repetitionUnit: true,
              weightUnit: true,
            },
          });

          return Response.json(created, { status: 201 });
        } catch (error) {
          console.error("Create set error:", error);
          return Response.json({ error: "Failed to create set" }, { status: 500 });
        }
      },
    },
  },
})
