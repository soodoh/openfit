import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { and, desc, eq, like } from "drizzle-orm";
import { nanoid } from "nanoid";
// Helper to get routine days with weekdays
async function getRoutineDaysWithWeekdays(routineId: string) {
  const days = await db.query.routineDays.findMany({
    where: eq(schema.routineDays.routineId, routineId),
    with: {
      weekdays: true,
    },
  });
  return days.map((day) =>
    Object.assign(day, {
      weekdays: day.weekdays.map((w) => w.weekday),
    }),
  );
}
export const Route = createFileRoute("/api/routines")({
  server: {
    handlers: {
      // GET /api/routines - List routines with pagination
      GET: async ({ request }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {
            return error;
          }
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get("cursor");
        const limit = Math.min(
          Number.parseInt(searchParams.get("limit") || "20", 10),
          100,
        );
        const searchTerm = searchParams.get("search") || "";
        // Build query conditions
        const conditions = [eq(schema.routines.userId, session.user.id)];
        if (searchTerm) {
          conditions.push(like(schema.routines.name, `%${searchTerm}%`));
        }
        // Get routines ordered by most recently updated
        const routines = await db.query.routines.findMany({
          where: and(...conditions),
          orderBy: desc(schema.routines.updatedAt),
          limit: limit + 1,
          offset: cursor ? Number.parseInt(cursor, 10) : 0,
        });
        // Check if there are more results
        const hasMore = routines.length > limit;
        const page = hasMore ? routines.slice(0, limit) : routines;
        // Fetch routine days for each routine
        const routinesWithDays = await Promise.all(
          page.map(async (routine) => {
            const routineDays = await getRoutineDaysWithWeekdays(routine.id);
            return Object.assign(routine, {
              routineDays,
            });
          }),
        );
        return Response.json({
          page: routinesWithDays,
          isDone: !hasMore,
          continueCursor: hasMore
            ? String((cursor ? Number.parseInt(cursor, 10) : 0) + limit)
            : null,
        });
      },
      // POST /api/routines - Create routine
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
          const body = await request.json();
          const { name, description } = body;
          const trimmedName = name?.trim();
          if (!trimmedName) {
            return Response.json(
              { error: "Name cannot be empty" },
              { status: 400 },
            );
          }
          const routineId = nanoid();
          await db.insert(schema.routines).values({
            id: routineId,
            userId: session.user.id,
            name: trimmedName,
            description: description?.trim() || null,
          });
          // Fetch created routine
          const routine = await db.query.routines.findFirst({
            where: eq(schema.routines.id, routineId),
          });
          return Response.json(
            { ...routine, routineDays: [] },
            { status: 201 },
          );
        } catch {
          return Response.json(
            { error: "Failed to create routine" },
            { status: 500 },
          );
        }
      },
    },
  },
});
export default Route;
