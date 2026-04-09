import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
import { parseJsonBody } from "@/lib/request-helpers";
import { reorderSetsSchema } from "@/lib/request-schemas";
export const Route = createFileRoute("/api/sets/reorder")({
	server: {
		handlers: {
			// POST /api/sets/reorder - Reorder sets within a set group
			POST: async ({ request }: { request: Request }) => {
				let session: NonNullable<AuthSession>;
				try {
					session = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}
				try {
					const body = await parseJsonBody(request, reorderSetsSchema);
					const { setGroupId, setIds } = body;
					// Verify set group ownership
					const setGroup = await db.query.workoutSetGroups.findFirst({
						where: eq(schema.workoutSetGroups.id, setGroupId),
					});
					if (!setGroup || setGroup.userId !== session.user.id) {
						return Response.json({ error: "Unauthorized" }, { status: 403 });
					}
					const setsToUpdate: Array<{ id: string; order: number }> = [];
					// Validate every existing set before applying any reorder mutation.
					for (const [index, setId] of setIds.entries()) {
						const set = await db.query.workoutSets.findFirst({
							where: eq(schema.workoutSets.id, setId),
						});
						if (!set) {
							continue;
						}
						if (
							set.userId !== session.user.id ||
							set.setGroupId !== setGroupId
						) {
							return Response.json({ error: "Unauthorized" }, { status: 403 });
						}
						setsToUpdate.push({ id: setId, order: index });
					}
					// Apply the reorder atomically so a later write failure cannot leave
					// the earlier rows partially updated.
					await db.transaction(async (tx) => {
						for (const { id, order } of setsToUpdate) {
							await tx
								.update(schema.workoutSets)
								.set({
									order,
									updatedAt: new Date(),
								})
								.where(eq(schema.workoutSets.id, id));
						}
					});
					return Response.json({ success: true });
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to reorder sets" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
