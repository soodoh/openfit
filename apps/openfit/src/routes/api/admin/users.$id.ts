import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { parseJsonBody } from "@/lib/request-helpers";
import { adminUserRoleUpdateSchema } from "@/lib/request-schemas";
export const Route = createFileRoute("/api/admin/users/$id")({
	server: {
		handlers: {
			PATCH: async ({
				request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				try {
					await requireAdmin(request);
					const { id } = params;
					const body = await parseJsonBody(request, adminUserRoleUpdateSchema);
					const updated = await db
						.update(schema.userProfiles)
						.set({ role: body.role })
						.where(eq(schema.userProfiles.id, id))
						.returning();
					if (updated.length === 0) {
						return Response.json({ error: "User not found" }, { status: 404 });
					}
					return Response.json(updated[0]);
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to update user" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
