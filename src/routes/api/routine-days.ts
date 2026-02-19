import { createFileRoute } from '@tanstack/react-router';
import { db } from "@/db";
import { schema } from "@/db/schema";
import { getOptionalSession, requireAuth } from "@/lib/auth-middleware";
import { and, eq, like } from "drizzle-orm";
import { nanoid } from "nanoid";
export const Route = createFileRoute('/api/routine-days')({
    server: {
        handlers: {
            // GET /api/routine-days - Search routine days
            GET: async ({ request }) => {
                const session = await getOptionalSession(request);
                if (!session) {
                    return Response.json([]);
                }
                const { searchParams } = new URL(request.url);
                const searchTerm = searchParams.get("search") || "";
                const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10", 10), 50);
                // Build query conditions
                const conditions = [eq(schema.routineDays.userId, session.user.id)];
                if (searchTerm) {
                    conditions.push(like(schema.routineDays.description, `%${searchTerm}%`));
                }
                const days = await db.query.routineDays.findMany({
                    where: and(...conditions),
                    limit,
                    with: {
                        routine: true,
                        weekdays: true,
                    },
                });
                // Transform to expected format
                const result = days.map((day) => Object.assign(day, {
                    weekdays: day.weekdays.map((w) => w.weekday),
                }));
                return Response.json(result);
            },
            // POST /api/routine-days - Create routine day
            POST: async ({ request }) => {
                let session;
                try {
                    session = await requireAuth(request);
                }
                catch (error) {
                    if (error instanceof Response) {
                        return error;
                    }
                    return Response.json({ error: "Unauthorized" }, { status: 401 });
                }
                try {
                    const body = await request.json();
                    const { routineId, description, weekdays = [] } = body;
                    // Verify routine ownership
                    const routine = await db.query.routines.findFirst({
                        where: eq(schema.routines.id, routineId),
                    });
                    if (!routine || routine.userId !== session.user.id) {
                        return Response.json({ error: "Unauthorized" }, { status: 403 });
                    }
                    const trimmedDescription = description?.trim();
                    if (!trimmedDescription) {
                        return Response.json({ error: "Description cannot be empty" }, { status: 400 });
                    }
                    // Validate weekdays
                    for (const day of weekdays) {
                        if (day < 0 || day > 6 || !Number.isInteger(day)) {
                            return Response.json({ error: "Weekdays must be integers between 0 and 6" }, { status: 400 });
                        }
                    }
                    // Create routine day
                    const routineDayId = nanoid();
                    await db.insert(schema.routineDays).values({
                        id: routineDayId,
                        routineId,
                        userId: session.user.id,
                        description: trimmedDescription,
                    });
                    // Create weekday entries
                    for (const weekday of weekdays) {
                        await db.insert(schema.routineDayWeekdays).values({
                            id: nanoid(),
                            routineDayId,
                            weekday,
                        });
                    }
                    // Fetch created routine day
                    const routineDay = await db.query.routineDays.findFirst({
                        where: eq(schema.routineDays.id, routineDayId),
                        with: {
                            routine: true,
                            weekdays: true,
                        },
                    });
                    return Response.json({
                        ...routineDay,
                        weekdays: routineDay?.weekdays.map((w) => w.weekday) || [],
                    }, { status: 201 });
                }
                catch {
                    return Response.json({ error: "Failed to create routine day" }, { status: 500 });
                }
            },
        },
    },
});
export default Route;
