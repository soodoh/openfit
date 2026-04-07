import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { schema } from "@/db/schema";
import type { CursorPage, RoutineDayDto, RoutineDto } from "@/lib/api-types";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
import { getRoutineDaysWithWeekdays } from "@/lib/data-loaders";
import { parseJsonBody, parseSearchParams } from "@/lib/request-helpers";
import {
	createRoutineSchema,
	routinesListQuerySchema,
} from "@/lib/request-schemas";

function serializeTimestamp(value: Date | string): string {
	return typeof value === "string" ? value : value.toISOString();
}

function serializeRoutineDay(
	routineDay: Omit<RoutineDayDto, "createdAt" | "updatedAt" | "weekdays"> & {
		createdAt: Date | string;
		updatedAt: Date | string;
		weekdays: Array<number | { weekday: number }>;
	},
): RoutineDayDto {
	return {
		...routineDay,
		createdAt: serializeTimestamp(routineDay.createdAt),
		updatedAt: serializeTimestamp(routineDay.updatedAt),
		weekdays: routineDay.weekdays.map((weekday) =>
			typeof weekday === "number" ? weekday : weekday.weekday,
		),
	};
}

function serializeRoutine(
	routine: Omit<RoutineDto, "createdAt" | "updatedAt" | "routineDays"> & {
		createdAt: Date | string;
		updatedAt: Date | string;
		routineDays: Array<
			Omit<RoutineDayDto, "createdAt" | "updatedAt" | "weekdays"> & {
				createdAt: Date | string;
				updatedAt: Date | string;
				weekdays: Array<number | { weekday: number }>;
			}
		>;
	},
): RoutineDto {
	return {
		...routine,
		createdAt: serializeTimestamp(routine.createdAt),
		updatedAt: serializeTimestamp(routine.updatedAt),
		routineDays: routine.routineDays.map(serializeRoutineDay),
	};
}

export const Route = createFileRoute("/api/routines")({
	server: {
		handlers: {
			// GET /api/routines - List routines with pagination
			GET: async ({ request }: { request: Request }) => {
				let session: NonNullable<AuthSession>;
				try {
					session = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				try {
					const { searchParams } = new URL(request.url);
					const {
						cursor,
						limit: rawLimit,
						search: searchTerm,
					} = parseSearchParams(searchParams, routinesListQuerySchema);
					const limit = rawLimit ?? 20;
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
						offset: cursor ?? 0,
					});
					// Check if there are more results
					const hasMore = routines.length > limit;
					const page = hasMore ? routines.slice(0, limit) : routines;
					// Fetch routine days for each routine
					const routinesWithDays = await Promise.all(
						page.map(async (routine) => {
							const routineDays = await getRoutineDaysWithWeekdays(routine.id);
							return serializeRoutine({
								...routine,
								routineDays,
							});
						}),
					);
					return Response.json({
						page: routinesWithDays,
						isDone: !hasMore,
						continueCursor: hasMore ? String((cursor ?? 0) + limit) : null,
					} satisfies CursorPage<RoutineDto>);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to fetch routines" },
						{ status: 500 },
					);
				}
			},
			// POST /api/routines - Create routine
			POST: async ({ request }: { request: Request }) => {
				let session: NonNullable<AuthSession>;
				try {
					session = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				try {
					const body = await parseJsonBody(request, createRoutineSchema);
					const { name, description } = body;
					const routineId = nanoid();
					await db.insert(schema.routines).values({
						id: routineId,
						userId: session.user.id,
						name,
						description: description?.trim() ?? null,
					});
					// Fetch created routine
					const routine = await db.query.routines.findFirst({
						where: eq(schema.routines.id, routineId),
					});
					if (!routine) {
						return Response.json(
							{ error: "Failed to create routine" },
							{ status: 500 },
						);
					}
					return Response.json(
						serializeRoutine({ ...routine, routineDays: [] }),
						{ status: 201 },
					);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
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
