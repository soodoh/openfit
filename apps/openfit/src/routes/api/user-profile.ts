import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import {
	type AuthSession,
	getOptionalSession,
	requireAuth,
} from "@/lib/auth-middleware";
import { parseJsonBody } from "@/lib/request-helpers";
import { updateUserProfileSchema } from "@/lib/request-schemas";

// GET /api/user-profile - Get current user's profile
// PATCH /api/user-profile - Update current user's profile
export const Route = createFileRoute("/api/user-profile")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const session = await getOptionalSession(request);
				if (!session) {
					return Response.json(null);
				}
				const profile = await db.query.userProfiles.findFirst({
					where: eq(schema.userProfiles.userId, session.user.id),
					with: {
						defaultRepetitionUnit: true,
						defaultWeightUnit: true,
						defaultGym: true,
					},
				});
				if (!profile) {
					return Response.json(null);
				}
				return Response.json(profile);
			},
			PATCH: async ({ request }: { request: Request }) => {
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
					const body = await parseJsonBody(request, updateUserProfileSchema);
					const {
						theme,
						defaultRepetitionUnitId,
						defaultWeightUnitId,
						defaultGymId,
					} = body;
					const profile = await db.query.userProfiles.findFirst({
						where: eq(schema.userProfiles.userId, session.user.id),
					});
					if (!profile) {
						return Response.json(
							{ error: "Profile not found" },
							{ status: 404 },
						);
					}
					if (defaultGymId !== undefined && defaultGymId !== null) {
						const defaultGym = await db.query.gyms.findFirst({
							where: and(
								eq(schema.gyms.id, defaultGymId),
								eq(schema.gyms.userId, session.user.id),
							),
						});
						if (!defaultGym) {
							return Response.json(
								{ error: "Default gym not found" },
								{ status: 400 },
							);
						}
					}
					await db
						.update(schema.userProfiles)
						.set({
							...(theme !== undefined && { theme }),
							...(defaultRepetitionUnitId !== undefined && {
								defaultRepetitionUnitId,
							}),
							...(defaultWeightUnitId !== undefined && { defaultWeightUnitId }),
							...(defaultGymId !== undefined && { defaultGymId }),
							updatedAt: new Date(),
						})
						.where(eq(schema.userProfiles.id, profile.id));
					const updated = await db.query.userProfiles.findFirst({
						where: eq(schema.userProfiles.id, profile.id),
						with: {
							defaultRepetitionUnit: true,
							defaultWeightUnit: true,
							defaultGym: true,
						},
					});
					return Response.json(updated);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to update profile" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
