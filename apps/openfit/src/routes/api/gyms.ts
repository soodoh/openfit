import { createFileRoute } from "@tanstack/react-router";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { loadGymWithEquipment } from "@/lib/api-resource-helpers";
import { serializeGym } from "@/lib/api-serializers";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
import { parseJsonBody } from "@/lib/request-helpers";
import { createGymSchema } from "@/lib/request-schemas";

export const Route = createFileRoute("/api/gyms")({
	server: {
		handlers: {
			// GET /api/gyms - List user's gyms
			GET: async ({ request }: { request: Request }) => {
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
					const gyms = await db.query.gyms.findMany({
						where: eq(schema.gyms.userId, session.user.id),
						orderBy: asc(schema.gyms.name),
						with: {
							equipment: {
								with: {
									equipment: true,
								},
							},
						},
					});
					return Response.json(gyms.map(serializeGym));
				} catch {
					return Response.json(
						{ error: "Failed to fetch gyms" },
						{ status: 500 },
					);
				}
			},
			// POST /api/gyms - Create a new gym
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
					const body = await parseJsonBody(request, createGymSchema);
					const { name, equipmentIds = [] } = body;
					// Create gym
					const gymId = nanoid();
					await db.insert(schema.gyms).values({
						id: gymId,
						userId: session.user.id,
						name,
					});
					// Add equipment
					for (const equipmentId of equipmentIds) {
						await db.insert(schema.gymEquipment).values({
							id: nanoid(),
							gymId,
							equipmentId,
						});
					}
					const gym = await loadGymWithEquipment(gymId);
					if (!gym) {
						return Response.json(
							{ error: "Failed to create gym" },
							{ status: 500 },
						);
					}
					return Response.json(serializeGym(gym), { status: 201 });
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to create gym" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
export default Route;
