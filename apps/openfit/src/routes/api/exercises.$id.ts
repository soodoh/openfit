import { createFileRoute } from "@tanstack/react-router";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";

export const Route = createFileRoute("/api/exercises/$id")({
	server: {
		handlers: {
			GET: async ({
				request: _request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				const { id } = params;
				const exercise = await db.query.exercises.findFirst({
					where: eq(schema.exercises.id, id),
					with: {
						equipment: true,
						category: true,
						primaryMuscles: { with: { muscleGroup: true } },
						secondaryMuscles: { with: { muscleGroup: true } },
						instructions: { orderBy: asc(schema.exerciseInstructions.order) },
						images: { orderBy: asc(schema.exerciseImages.order) },
					},
				});
				if (!exercise) {
					return Response.json(
						{ error: "Exercise not found" },
						{ status: 404 },
					);
				}
				const result = {
					...exercise,
					primaryMuscleIds: exercise.primaryMuscles.map(
						(pm) => pm.muscleGroupId,
					),
					secondaryMuscleIds: exercise.secondaryMuscles.map(
						(sm) => sm.muscleGroupId,
					),
					instructions: exercise.instructions.map((i) => i.instruction),
					imageUrls: exercise.images.map((img) => img.path),
				};
				return Response.json(result);
			},
		},
	},
});

export default Route;
