import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
type CreateSetGroupBody = {
  sessionId?: string;
  routineDayId?: string;
  type?: "NORMAL" | "SUPERSET";
  exerciseId?: string;
  numSets?: number;
};
async function ensureTargetOwnership(
  userId: string,
  sessionId: string | undefined,
  routineDayId: string | undefined,
): Promise<boolean> {
  if (sessionId) {
    const workoutSession = await db.query.workoutSessions.findFirst({
      where: eq(schema.workoutSessions.id, sessionId),
    });
    if (!workoutSession || workoutSession.userId !== userId) {
      return false;
    }
  }
  if (routineDayId) {
    const routineDay = await db.query.routineDays.findFirst({
      where: eq(schema.routineDays.id, routineDayId),
    });
    if (!routineDay || routineDay.userId !== userId) {
      return false;
    }
  }
  return true;
}
async function getNextSetGroupOrder(
  sessionId: string | undefined,
  routineDayId: string | undefined,
): Promise<number> {
  const existingSetGroups = sessionId
    ? await db.query.workoutSetGroups.findMany({
        where: eq(schema.workoutSetGroups.sessionId, sessionId),
      })
    : await db.query.workoutSetGroups.findMany({
        where: eq(schema.workoutSetGroups.routineDayId, routineDayId),
      });
  if (existingSetGroups.length === 0) {
    return 0;
  }
  return Math.max(...existingSetGroups.map((setGroup) => setGroup.order)) + 1;
}
async function getDefaultUnitIds(): Promise<
  | {
      repetitionUnitId: string;
      weightUnitId: string;
    }
  | undefined
> {
  const repUnits = await db.query.repetitionUnits.findMany({ limit: 1 });
  const weightUnits = await db.query.weightUnits.findMany({ limit: 1 });
  if (repUnits.length === 0 || weightUnits.length === 0) {
    return undefined;
  }
  return {
    repetitionUnitId: repUnits[0].id,
    weightUnitId: weightUnits[0].id,
  };
}
async function createSetGroupResponse(
  userId: string,
  body: CreateSetGroupBody,
): Promise<Response> {
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
    return Response.json({ error: "exerciseId is required" }, { status: 400 });
  }
  const hasOwnership = await ensureTargetOwnership(
    userId,
    sessionId,
    routineDayId,
  );
  if (!hasOwnership) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }
  const unitIds = await getDefaultUnitIds();
  if (!unitIds) {
    return Response.json(
      { error: "Units not found - please seed the database first" },
      { status: 500 },
    );
  }
  const setGroupId = nanoid();
  await db.insert(schema.workoutSetGroups).values({
    id: setGroupId,
    userId,
    routineDayId: routineDayId || null,
    sessionId: sessionId || null,
    type,
    order: await getNextSetGroupOrder(sessionId, routineDayId),
  });
  for (let i = 0; i < numSets; i += 1) {
    await db.insert(schema.workoutSets).values({
      id: nanoid(),
      userId,
      setGroupId,
      exerciseId,
      type: "NORMAL",
      order: i,
      reps: 10,
      repetitionUnitId: unitIds.repetitionUnitId,
      weight: 0,
      weightUnitId: unitIds.weightUnitId,
      restTime: 0,
      completed: false,
    });
  }
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
}
export const Route = createFileRoute("/api/set-groups")({
  server: {
    handlers: {
      // POST /api/set-groups - Create set group with sets
      POST: async ({ request }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {
            return error;
          }
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        try {
          const body = (await request.json()) as CreateSetGroupBody;
          return createSetGroupResponse(session.user.id, body);
        } catch {
          return Response.json(
            { error: "Failed to create set group" },
            { status: 500 },
          );
        }
      },
    },
  },
});
export default Route;
