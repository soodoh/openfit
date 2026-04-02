import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { type AuthSession, requireAuth } from "@/lib/auth-middleware";
export const Route = createFileRoute("/api/admin/check")({
	server: {
		handlers: {
			// GET /api/admin/check - Check if current user is admin
			GET: async ({ request }: { request: Request }) => {
				let session: NonNullable<AuthSession>;
				try {
					session = await requireAuth(request);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json({ isAdmin: false }, { status: 401 });
				}
				const profile = await db.query.userProfiles.findFirst({
					where: eq(schema.userProfiles.userId, session.user.id),
				});
				return Response.json({ isAdmin: profile?.role === "ADMIN" });
			},
		},
	},
});

export default Route;
