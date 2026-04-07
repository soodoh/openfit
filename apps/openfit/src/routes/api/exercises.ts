import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { withFirstExerciseImageUrls } from "@/lib/data-loaders";
import { parseSearchParams } from "@/lib/request-helpers";
import { exercisesListQuerySchema } from "@/lib/request-schemas";

export const Route = createFileRoute("/api/exercises")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				try {
					const { searchParams } = new URL(request.url);
					const {
						cursor,
						limit: rawLimit,
						search: searchTerm,
						equipmentId,
						equipmentIds = [],
						level,
						categoryId,
						primaryMuscleId,
					} = parseSearchParams(searchParams, exercisesListQuerySchema);
					const limit = rawLimit ?? 20;
					const conditions: Array<ReturnType<typeof eq>> = [];
					if (equipmentId) {
						conditions.push(eq(schema.exercises.equipmentId, equipmentId));
					}
					if (level) {
						conditions.push(eq(schema.exercises.level, level));
					}
					if (categoryId) {
						conditions.push(eq(schema.exercises.categoryId, categoryId));
					}
					if (searchTerm) {
						conditions.push(like(schema.exercises.name, `%${searchTerm}%`));
					}
					let exercises = await db.query.exercises.findMany({
						where: conditions.length > 0 ? and(...conditions) : undefined,
						orderBy: asc(schema.exercises.name),
						limit: limit + 1,
						offset: cursor ?? 0,
						with: {
							equipment: true,
							category: true,
							primaryMuscles: {
								with: {
									muscleGroup: true,
								},
							},
						},
					});
					if (primaryMuscleId) {
						exercises = exercises.filter((e) =>
							e.primaryMuscles.some(
								(pm) => pm.muscleGroupId === primaryMuscleId,
							),
						);
					}
					if (equipmentIds.length > 0) {
						exercises = exercises.filter((e) => {
							if (!e.equipmentId) {
								return true;
							}
							return equipmentIds.includes(e.equipmentId);
						});
					}
					const hasMore = exercises.length > limit;
					if (hasMore) {
						exercises = exercises.slice(0, limit);
					}
					const exercisesWithImages =
						await withFirstExerciseImageUrls(exercises);
					const page = exercisesWithImages.map((e) =>
						Object.assign(e, {
							primaryMuscleIds: e.primaryMuscles.map((pm) => pm.muscleGroupId),
							secondaryMuscleIds: [],
						}),
					);
					return Response.json({
						page,
						isDone: !hasMore,
						continueCursor: hasMore ? String((cursor ?? 0) + limit) : null,
					});
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to fetch exercises" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
