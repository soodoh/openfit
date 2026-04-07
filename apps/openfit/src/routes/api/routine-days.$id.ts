import { createFileRoute } from "@tanstack/react-router";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { schema } from "@/db/schema";
import type {
	MutationSuccessResult,
	RoutineDayDetailDto,
	RoutineDayDto,
} from "@/lib/api-types";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
import { getFirstExerciseImageUrl } from "@/lib/data-loaders";
import { parseJsonBody } from "@/lib/request-helpers";
import { updateRoutineDaySchema } from "@/lib/request-schemas";

function serializeTimestamp(value: Date | string): string {
	return typeof value === "string" ? value : value.toISOString();
}

function serializeRoutineDay(
	routineDay: Omit<
		RoutineDayDto,
		"createdAt" | "updatedAt" | "weekdays" | "routine"
	> & {
		createdAt: Date | string;
		updatedAt: Date | string;
		routine?:
			| (Omit<
					NonNullable<RoutineDayDto["routine"]>,
					"createdAt" | "updatedAt"
			  > & {
					createdAt: Date | string;
					updatedAt: Date | string;
			  })
			| null;
		weekdays: Array<number | { weekday: number }>;
	},
): RoutineDayDto {
	return {
		...routineDay,
		createdAt: serializeTimestamp(routineDay.createdAt),
		updatedAt: serializeTimestamp(routineDay.updatedAt),
		routine: routineDay.routine
			? {
					...routineDay.routine,
					createdAt: serializeTimestamp(routineDay.routine.createdAt),
					updatedAt: serializeTimestamp(routineDay.routine.updatedAt),
				}
			: routineDay.routine,
		weekdays: routineDay.weekdays.map((weekday) =>
			typeof weekday === "number" ? weekday : weekday.weekday,
		),
	};
}

export const Route = createFileRoute("/api/routine-days/$id")({
	server: {
		handlers: {
			// GET /api/routine-days/[id] - Get single routine day with full data
			GET: async ({
				request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				let session: NonNullable<AuthSession>;
				try {
					session = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				const { id } = params;
				const routineDay = await db.query.routineDays.findFirst({
					where: eq(schema.routineDays.id, id),
					with: {
						routine: true,
						weekdays: true,
					},
				});
				if (!routineDay) {
					return Response.json(
						{ error: "Routine day not found" },
						{ status: 404 },
					);
				}
				if (routineDay.userId !== session.user.id) {
					return Response.json({ error: "Unauthorized" }, { status: 403 });
				}
				// Fetch set groups ordered by order field
				const setGroups = await db.query.workoutSetGroups.findMany({
					where: eq(schema.workoutSetGroups.routineDayId, id),
					orderBy: asc(schema.workoutSetGroups.order),
				});
				// Fetch sets for each set group
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
						// Add image URL to each exercise
						const setsWithImages = await Promise.all(
							sets.map(async (set) => {
								const imageUrl = set.exercise
									? await getFirstExerciseImageUrl(set.exercise.id)
									: null;
								return {
									...set,
									createdAt: serializeTimestamp(set.createdAt),
									updatedAt: serializeTimestamp(set.updatedAt),
									exercise: set.exercise ? { ...set.exercise, imageUrl } : null,
								};
							}),
						);
						return {
							...group,
							createdAt: serializeTimestamp(group.createdAt),
							updatedAt: serializeTimestamp(group.updatedAt),
							sets: setsWithImages,
						};
					}),
				);
				const serializedRoutineDay = serializeRoutineDay(routineDay);
				const payload = {
					...serializedRoutineDay,
					routine: serializedRoutineDay.routine ?? null,
					setGroups: setGroupsWithSets,
				} satisfies RoutineDayDetailDto;
				return Response.json(payload);
			},
			// PATCH /api/routine-days/[id] - Update routine day
			PATCH: async ({
				request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				let session: NonNullable<AuthSession>;
				try {
					session = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				const { id } = params;
				try {
					const routineDay = await db.query.routineDays.findFirst({
						where: eq(schema.routineDays.id, id),
					});
					if (!routineDay) {
						return Response.json(
							{ error: "Routine day not found" },
							{ status: 404 },
						);
					}
					if (routineDay.userId !== session.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					const body = await parseJsonBody(request, updateRoutineDaySchema);
					const { description, weekdays } = body;
					// Update routine day
					await db
						.update(schema.routineDays)
						.set({
							...(description !== undefined && {
								description,
							}),
							updatedAt: new Date(),
						})
						.where(eq(schema.routineDays.id, id));
					// Update weekdays if provided
					if (weekdays !== undefined) {
						// Delete existing weekdays
						await db
							.delete(schema.routineDayWeekdays)
							.where(eq(schema.routineDayWeekdays.routineDayId, id));
						// Create new weekdays
						for (const weekday of weekdays) {
							await db.insert(schema.routineDayWeekdays).values({
								id: nanoid(),
								routineDayId: id,
								weekday,
							});
						}
					}
					// Fetch updated routine day
					const updated = await db.query.routineDays.findFirst({
						where: eq(schema.routineDays.id, id),
						with: {
							routine: true,
							weekdays: true,
						},
					});
					if (!updated) {
						return Response.json(
							{ error: "Routine day not found" },
							{ status: 404 },
						);
					}
					return Response.json(serializeRoutineDay(updated));
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to update routine day" },
						{ status: 500 },
					);
				}
			},
			// DELETE /api/routine-days/[id] - Delete routine day (cascades)
			DELETE: async ({
				request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				let session: NonNullable<AuthSession>;
				try {
					session = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				const { id } = params;
				try {
					const routineDay = await db.query.routineDays.findFirst({
						where: eq(schema.routineDays.id, id),
					});
					if (!routineDay) {
						return Response.json(
							{ error: "Routine day not found" },
							{ status: 404 },
						);
					}
					if (routineDay.userId !== session.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					// Delete routine day (cascades to weekdays, set groups, sets via FK)
					await db
						.delete(schema.routineDays)
						.where(eq(schema.routineDays.id, id));
					return Response.json({
						success: true,
					} satisfies MutationSuccessResult);
				} catch {
					return Response.json(
						{ error: "Failed to delete routine day" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
export default Route;
