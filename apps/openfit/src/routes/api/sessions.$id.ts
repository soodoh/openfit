import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
import { getSessionWithData } from "@/lib/data-loaders";
import { parseJsonBody } from "@/lib/request-helpers";
import { updateSessionSchema } from "@/lib/request-schemas";
export const Route = createFileRoute("/api/sessions/$id")({
	server: {
		handlers: {
			// GET /api/sessions/[id] - Get single session
			GET: async ({
				request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				let authSession: NonNullable<AuthSession>;
				try {
					authSession = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				const { id } = params;
				try {
					const session = await db.query.workoutSessions.findFirst({
						where: eq(schema.workoutSessions.id, id),
					});
					if (!session) {
						return Response.json(
							{ error: "Session not found" },
							{ status: 404 },
						);
					}
					if (session.userId !== authSession.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					const sessionWithData = await getSessionWithData(id);
					return Response.json(sessionWithData);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to fetch session" },
						{ status: 500 },
					);
				}
			},
			// PATCH /api/sessions/[id] - Update session
			PATCH: async ({
				request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				let authSession: NonNullable<AuthSession>;
				try {
					authSession = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				const { id } = params;
				try {
					const session = await db.query.workoutSessions.findFirst({
						where: eq(schema.workoutSessions.id, id),
					});
					if (!session) {
						return Response.json(
							{ error: "Session not found" },
							{ status: 404 },
						);
					}
					if (session.userId !== authSession.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					const body = await parseJsonBody(request, updateSessionSchema);
					const { name, notes, impression, startTime, endTime } = body;
					await db
						.update(schema.workoutSessions)
						.set({
							...(name !== undefined && { name: name.trim() }),
							...(notes !== undefined && { notes: notes.trim() }),
							...(impression !== undefined && { impression }),
							...(startTime !== undefined && {
								startTime: new Date(startTime),
							}),
							...(endTime !== undefined && {
								endTime: endTime ? new Date(endTime) : null,
							}),
							updatedAt: new Date(),
						})
						.where(eq(schema.workoutSessions.id, id));
					const updated = await getSessionWithData(id);
					return Response.json(updated);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to update session" },
						{ status: 500 },
					);
				}
			},
			// DELETE /api/sessions/[id] - Delete session (cascades)
			DELETE: async ({
				request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				let authSession: NonNullable<AuthSession>;
				try {
					authSession = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				const { id } = params;
				try {
					const session = await db.query.workoutSessions.findFirst({
						where: eq(schema.workoutSessions.id, id),
					});
					if (!session) {
						return Response.json(
							{ error: "Session not found" },
							{ status: 404 },
						);
					}
					if (session.userId !== authSession.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					// Delete session (cascades to set groups, sets via FK)
					await db
						.delete(schema.workoutSessions)
						.where(eq(schema.workoutSessions.id, id));
					return Response.json({ success: true });
				} catch {
					return Response.json(
						{ error: "Failed to delete session" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
export default Route;
