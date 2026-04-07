import { createFileRoute } from "@tanstack/react-router";
import { asc, like } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { withFirstExerciseImageUrls } from "@/lib/data-loaders";
import { parseSearchParams } from "@/lib/request-helpers";
import { similarExercisesQuerySchema } from "@/lib/request-schemas";
export const Route = createFileRoute("/api/exercises/similar")({
	server: {
		handlers: {
			// GET /api/exercises/similar - Search for similar exercises
			GET: async ({ request }: { request: Request }) => {
				try {
					const { searchParams } = new URL(request.url);
					const {
						q: searchTerm,
						equipmentIds = [],
						primaryMuscleIds = [],
						exclude: excludeExerciseId,
						limit,
					} = parseSearchParams(searchParams, similarExercisesQuerySchema);
					if (primaryMuscleIds.length === 0) {
						return Response.json([]);
					}
					// Build query
					let exercises = await db.query.exercises.findMany({
						where: searchTerm
							? like(schema.exercises.name, `%${searchTerm}%`)
							: undefined,
						orderBy: asc(schema.exercises.name),
						limit: 100, // Fetch more for filtering
						with: {
							primaryMuscles: true,
						},
					});
					// Filter by primary muscles - must share at least one
					exercises = exercises.filter((e) => {
						// Exclude the current exercise
						if (excludeExerciseId && e.id === excludeExerciseId) {
							return false;
						}
						// Must share at least one primary muscle
						return e.primaryMuscles.some((pm) =>
							primaryMuscleIds.includes(pm.muscleGroupId),
						);
					});
					// Apply equipment filter if provided
					// Bodyweight exercises (no equipment) are always included
					if (equipmentIds.length > 0) {
						exercises = exercises.filter((e) => {
							if (!e.equipmentId) {
								return true;
							}
							return equipmentIds.includes(e.equipmentId);
						});
					}
					// Limit results
					exercises = exercises.slice(0, limit);
					const exercisesWithImages =
						await withFirstExerciseImageUrls(exercises);
					const results = exercisesWithImages.map((exercise) => ({
						...exercise,
						primaryMuscleIds: exercise.primaryMuscles.map(
							(pm) => pm.muscleGroupId,
						),
					}));
					return Response.json(results);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to load similar exercises" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
export default Route;
