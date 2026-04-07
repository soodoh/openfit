import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { getOptionalSession } from "@/lib/auth-middleware";
import { getSessionWithData } from "@/lib/data-loaders";
export const Route = createFileRoute("/api/sessions/current")({
	server: {
		handlers: {
			// GET /api/sessions/current - Get the current active session
			GET: async ({ request }: { request: Request }) => {
				const session = await getOptionalSession(request);
				if (!session) {
					return Response.json(null);
				}
				// Find most recent session without endTime
				const activeSessions = await db.query.workoutSessions.findMany({
					where: and(
						eq(schema.workoutSessions.userId, session.user.id),
						isNull(schema.workoutSessions.endTime),
					),
					orderBy: desc(schema.workoutSessions.startTime),
					limit: 1,
				});
				if (activeSessions.length === 0) {
					return Response.json(null);
				}
				const currentSession = await getSessionWithData(activeSessions[0].id);
				return Response.json(currentSession);
			},
		},
	},
});
export default Route;
