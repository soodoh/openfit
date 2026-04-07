import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { schema } from "@/db/schema";
import {
	loadGymWithEquipment,
	requireOwnedGym,
} from "@/lib/api-resource-helpers";
import { serializeGym } from "@/lib/api-serializers";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
import { parseJsonBody } from "@/lib/request-helpers";
import { updateGymSchema } from "@/lib/request-schemas";

export const Route = createFileRoute("/api/gyms/$id")({
	server: {
		handlers: {
			// GET /api/gyms/[id] - Get single gym
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
				const ownership = await requireOwnedGym(session.user.id, id);
				if (ownership.status !== 200) {
					return Response.json(
						{ error: ownership.error },
						{ status: ownership.status },
					);
				}
				return Response.json(serializeGym(ownership.gym));
			},
			// PATCH /api/gyms/[id] - Update gym
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
					const ownership = await requireOwnedGym(session.user.id, id);
					if (ownership.status !== 200) {
						return Response.json(
							{ error: ownership.error },
							{ status: ownership.status },
						);
					}
					const body = await parseJsonBody(request, updateGymSchema);
					const { name, equipmentIds } = body;
					// Update gym
					await db
						.update(schema.gyms)
						.set({
							...(name !== undefined && { name }),
							updatedAt: new Date(),
						})
						.where(eq(schema.gyms.id, id));
					// Update equipment if provided
					if (equipmentIds !== undefined) {
						// Delete existing equipment
						await db
							.delete(schema.gymEquipment)
							.where(eq(schema.gymEquipment.gymId, id));
						// Add new equipment
						for (const equipmentId of equipmentIds) {
							await db.insert(schema.gymEquipment).values({
								id: nanoid(),
								gymId: id,
								equipmentId,
							});
						}
					}
					const updated = await loadGymWithEquipment(id);
					if (!updated) {
						return Response.json({ error: "Gym not found" }, { status: 404 });
					}
					return Response.json(serializeGym(updated));
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to update gym" },
						{ status: 500 },
					);
				}
			},
			// DELETE /api/gyms/[id] - Delete gym
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
					const ownership = await requireOwnedGym(session.user.id, id);
					if (ownership.status !== 200) {
						return Response.json(
							{ error: ownership.error },
							{ status: ownership.status },
						);
					}
					// Delete gym (cascades to equipment via FK)
					await db.delete(schema.gyms).where(eq(schema.gyms.id, id));
					return Response.json({ success: true });
				} catch {
					return Response.json(
						{ error: "Failed to delete gym" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
