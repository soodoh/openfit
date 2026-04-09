import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import {
	loadRoutineById,
	requireOwnedRoutine,
} from "@/lib/api-resource-helpers";
import { serializeRoutine } from "@/lib/api-serializers";
import type { MutationSuccessResult } from "@/lib/api-types";
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
				try {
					const ownership = await requireOwnedRoutine(session.user.id, id);
					if (ownership.status !== 200) {
						return Response.json(
							{ error: ownership.error },
							{ status: ownership.status },
						);
					}
					const routineDays = await getRoutineDaysWithWeekdays(id);
					return Response.json(
						serializeRoutine({
							...ownership.routine,
							routineDays,
						}),
					);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to fetch routine" },
						{ status: 500 },
					);
				}
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
					const ownership = await requireOwnedRoutine(session.user.id, id);
					if (ownership.status !== 200) {
						return Response.json(
							{ error: ownership.error },
							{ status: ownership.status },
						);
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
					const updated = await loadRoutineById(id);
					const routineDays = await getRoutineDaysWithWeekdays(id);
					if (!updated) {
						return Response.json(
							{ error: "Routine not found" },
							{ status: 404 },
						);
					}
					return Response.json(
						serializeRoutine({
							...updated,
							routineDays,
						}),
					);
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
					const ownership = await requireOwnedRoutine(session.user.id, id);
					if (ownership.status !== 200) {
						return Response.json(
							{ error: ownership.error },
							{ status: ownership.status },
						);
					}
					// Delete routine (cascades to routine days, set groups, sets via FK)
					await db.delete(schema.routines).where(eq(schema.routines.id, id));
					return Response.json({
						success: true,
					} satisfies MutationSuccessResult);
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
