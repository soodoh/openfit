import { createFileRoute } from "@tanstack/react-router";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
// GET /api/lookups/muscle-groups - Get all muscle groups
export const Route = createFileRoute("/api/lookups/muscle-groups")({
	server: {
		handlers: {
			GET: async () => {
				const muscleGroups = await db.query.muscleGroups.findMany({
					orderBy: asc(schema.muscleGroups.name),
				});
				return Response.json(muscleGroups);
			},
		},
	},
});

export default Route;
