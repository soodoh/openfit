import { createFileRoute } from "@tanstack/react-router";
import { and, eq, like } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { schema } from "@/db/schema";
import type { RoutineDayDto } from "@/lib/api-types";
import {
	type AuthSession,
	getOptionalSession,
	requireAuth,
} from "@/lib/auth-middleware";
import { parseJsonBody, parseSearchParams } from "@/lib/request-helpers";
import {
	createRoutineDaySchema,
	routineDaysListQuerySchema,
} from "@/lib/request-schemas";

function serializeRoutineDay(
	routineDay: Omit<RoutineDayDto, "weekdays"> & {
		weekdays: Array<number | { weekday: number }>;
	},
): RoutineDayDto {
	return {
		...routineDay,
		weekdays: routineDay.weekdays.map((weekday) =>
			typeof weekday === "number" ? weekday : weekday.weekday,
		),
	};
}

export const Route = createFileRoute("/api/routine-days")({
	server: {
		handlers: {
			// GET /api/routine-days - Search routine days
			GET: async ({ request }: { request: Request }) => {
				const session = await getOptionalSession(request);
				if (!session) {
					return Response.json([]);
				}
				try {
					const { searchParams } = new URL(request.url);
					const { search: searchTerm, limit } = parseSearchParams(
						searchParams,
						routineDaysListQuerySchema,
					);
					// Build query conditions
					const conditions = [eq(schema.routineDays.userId, session.user.id)];
					if (searchTerm) {
						conditions.push(
							like(schema.routineDays.description, `%${searchTerm}%`),
						);
					}
					const days = await db.query.routineDays.findMany({
						where: and(...conditions),
						limit,
						with: {
							routine: true,
							weekdays: true,
						},
					});
					const result = days.map(serializeRoutineDay);
					return Response.json(result);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to fetch routine days" },
						{ status: 500 },
					);
				}
			},
			// POST /api/routine-days - Create routine day
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
					const body = await parseJsonBody(request, createRoutineDaySchema);
					const { routineId, description, weekdays = [] } = body;
					// Verify routine ownership
					const routine = await db.query.routines.findFirst({
						where: eq(schema.routines.id, routineId),
					});
					if (!routine || routine.userId !== session.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					// Create routine day
					const routineDayId = nanoid();
					await db.insert(schema.routineDays).values({
						id: routineDayId,
						routineId,
						userId: session.user.id,
						description,
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
					if (!routineDay) {
						return Response.json(
							{ error: "Failed to create routine day" },
							{ status: 500 },
						);
					}
					return Response.json(serializeRoutineDay(routineDay), {
						status: 201,
					});
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to create routine day" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
export default Route;
