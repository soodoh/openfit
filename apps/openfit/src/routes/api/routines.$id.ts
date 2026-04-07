import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
import { getRoutineDaysWithWeekdays } from "@/lib/data-loaders";
import { parseJsonBody } from "@/lib/request-helpers";
import { updateRoutineSchema } from "@/lib/request-schemas";
export const Route = createFileRoute("/api/routines/$id")({
	server: {
		handlers: {
			// GET /api/routines/[id] - Get single routine
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
				const routine = await db.query.routines.findFirst({
					where: eq(schema.routines.id, id),
				});
				if (!routine) {
					return Response.json({ error: "Routine not found" }, { status: 404 });
				}
				if (routine.userId !== session.user.id) {
					return Response.json({ error: "Unauthorized" }, { status: 403 });
				}
				const routineDays = await getRoutineDaysWithWeekdays(id);
				return Response.json({
					...routine,
					routineDays,
				});
			},
			// PATCH /api/routines/[id] - Update routine
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
					const routine = await db.query.routines.findFirst({
						where: eq(schema.routines.id, id),
					});
					if (!routine) {
						return Response.json(
							{ error: "Routine not found" },
							{ status: 404 },
						);
					}
					if (routine.userId !== session.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					const body = await parseJsonBody(request, updateRoutineSchema);
					const { name, description } = body;
					await db
						.update(schema.routines)
						.set({
							...(name !== undefined && { name }),
							...(description !== undefined && {
								description: description?.trim() || null,
							}),
							updatedAt: new Date(),
						})
						.where(eq(schema.routines.id, id));
					const updated = await db.query.routines.findFirst({
						where: eq(schema.routines.id, id),
					});
					const routineDays = await getRoutineDaysWithWeekdays(id);
					return Response.json({
						...updated,
						routineDays,
					});
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to update routine" },
						{ status: 500 },
					);
				}
			},
			// DELETE /api/routines/[id] - Delete routine (cascades)
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
					const routine = await db.query.routines.findFirst({
						where: eq(schema.routines.id, id),
					});
					if (!routine) {
						return Response.json(
							{ error: "Routine not found" },
							{ status: 404 },
						);
					}
					if (routine.userId !== session.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					// Delete routine (cascades to routine days, set groups, sets via FK)
					await db.delete(schema.routines).where(eq(schema.routines.id, id));
					return Response.json({ success: true });
				} catch {
					return Response.json(
						{ error: "Failed to delete routine" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
export default Route;
