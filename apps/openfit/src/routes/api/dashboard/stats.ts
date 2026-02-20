import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { createFileRoute } from "@tanstack/react-router";
import { and, count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
// GET /api/dashboard/stats - Get dashboard statistics
export const Route = createFileRoute("/api/dashboard/stats")({
  server: {
    handlers: {
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
        // Get total sessions
        const totalSessionsResult = await db
          .select({ count: count() })
          .from(schema.workoutSessions)
          .where(eq(schema.workoutSessions.userId, session.user.id));
        const totalSessions = totalSessionsResult[0]?.count || 0;
        // Get total routines
        const totalRoutinesResult = await db
          .select({ count: count() })
          .from(schema.routines)
          .where(eq(schema.routines.userId, session.user.id));
        const totalRoutines = totalRoutinesResult[0]?.count || 0;
        // Get this week's sessions (Monday to Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        const thisWeekResult = await db
          .select({ count: count() })
          .from(schema.workoutSessions)
          .where(
            and(
              eq(schema.workoutSessions.userId, session.user.id),
              gte(schema.workoutSessions.startTime, monday),
              isNotNull(schema.workoutSessions.endTime),
            ),
          );
        const thisWeekSessions = thisWeekResult[0]?.count || 0;
        // Calculate current streak (consecutive days with workouts)
        // Get all completed session dates
        const sessionDates = await db
          .select({
            date: sql<string>`date(${schema.workoutSessions.startTime})`.as(
              "date",
            ),
          })
          .from(schema.workoutSessions)
          .where(
            and(
              eq(schema.workoutSessions.userId, session.user.id),
              isNotNull(schema.workoutSessions.endTime),
            ),
          )
          .groupBy(sql`date(${schema.workoutSessions.startTime})`)
          .orderBy(desc(sql`date(${schema.workoutSessions.startTime})`));
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < sessionDates.length; i += 1) {
          const sessionDate = new Date(sessionDates[i].date);
          sessionDate.setHours(0, 0, 0, 0);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          expectedDate.setHours(0, 0, 0, 0);
          if (sessionDate.getTime() === expectedDate.getTime()) {
            currentStreak += 1;
          } else if (i === 0) {
            // If today has no session, check if yesterday was the start
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (sessionDate.getTime() === yesterday.getTime()) {
              currentStreak += 1;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        return Response.json({
          totalSessions,
          totalRoutines,
          thisWeekSessions,
          currentStreak,
        });
      },
    },
  },
});
export default Route;
