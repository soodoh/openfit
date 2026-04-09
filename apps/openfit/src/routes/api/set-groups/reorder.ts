import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
import { parseJsonBody } from "@/lib/request-helpers";
import { reorderSetGroupsSchema } from "@/lib/request-schemas";
export const Route = createFileRoute("/api/set-groups/reorder")({
	server: {
		handlers: {
			// POST /api/set-groups/reorder - Reorder set groups
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
					const body = await parseJsonBody(request, reorderSetGroupsSchema);
					const { setGroupIds } = body;
					const setGroupsToUpdate: Array<{ id: string; order: number }> = [];
					// Validate ownership for every existing set group before mutating.
					for (const [index, setGroupId] of setGroupIds.entries()) {
						const setGroup = await db.query.workoutSetGroups.findFirst({
							where: eq(schema.workoutSetGroups.id, setGroupId),
						});
						if (!setGroup) {
							continue;
						}
						if (setGroup.userId !== session.user.id) {
							return Response.json({ error: "Unauthorized" }, { status: 403 });
						}
						setGroupsToUpdate.push({ id: setGroupId, order: index });
					}
					// Apply the reorder atomically so a later write failure cannot leave
					// the earlier rows partially updated.
					await db.transaction(async (tx) => {
						for (const { id, order } of setGroupsToUpdate) {
							await tx
								.update(schema.workoutSetGroups)
								.set({
									order,
									updatedAt: new Date(),
								})
								.where(eq(schema.workoutSetGroups.id, id));
						}
					});
					return Response.json({ success: true });
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to reorder set groups" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
