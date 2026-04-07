import { createFileRoute } from "@tanstack/react-router";
import { asc, like } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { getFirstExerciseImageUrl } from "@/lib/data-loaders";
import { parseSearchParams } from "@/lib/request-helpers";
import { exerciseSearchQuerySchema } from "@/lib/request-schemas";
export const Route = createFileRoute("/api/exercises/search")({
	server: {
		handlers: {
			// GET /api/exercises/search - Simple search for autocomplete
			GET: async ({ request }: { request: Request }) => {
				try {
					const { searchParams } = new URL(request.url);
					const {
						q: searchTerm,
						equipmentIds = [],
						limit,
					} = parseSearchParams(searchParams, exerciseSearchQuerySchema);
					// Build query
					let exercises = await db.query.exercises.findMany({
						where: searchTerm
							? like(schema.exercises.name, `%${searchTerm}%`)
							: undefined,
						orderBy: asc(schema.exercises.name),
						limit: 50, // Fetch more for filtering
						with: {
							primaryMuscles: true,
						},
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
					// Add image URLs
					const results = [];
					for (const exercise of exercises) {
						const imageUrl = await getFirstExerciseImageUrl(exercise.id);
						results.push({
							...exercise,
							imageUrl,
							primaryMuscleIds: exercise.primaryMuscles.map(
								(pm) => pm.muscleGroupId,
							),
						});
					}
					return Response.json(results);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to search exercises" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
export default Route;
