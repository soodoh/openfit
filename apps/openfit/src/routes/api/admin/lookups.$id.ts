import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { parseJsonBody, parseSearchParams } from "@/lib/request-helpers";
import {
	adminLookupDeleteQuerySchema,
	adminLookupMutationSchema,
} from "@/lib/request-schemas";

const tableMap = {
	equipment: schema.equipment,
	categories: schema.categories,
	muscleGroups: schema.muscleGroups,
	repetitionUnits: schema.repetitionUnits,
	weightUnits: schema.weightUnits,
};
export const Route = createFileRoute("/api/admin/lookups/$id")({
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
					const body = await parseJsonBody(request, adminLookupMutationSchema);
					const { type } = body;
					if (!type || !tableMap[type]) {
						return Response.json({ error: "Invalid type" }, { status: 400 });
					}
					const table = tableMap[type];
					await db
						.update(table)
						.set({ name: body.name })
						.where(eq(table.id, id));
					return Response.json({ success: true });
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to update lookup" },
						{ status: 500 },
					);
				}
			},
			DELETE: async ({
				request,
				params,
			}: {
				request: Request;
				params: Record<string, string>;
			}) => {
				try {
					await requireAdmin(request);
					const { id } = params;
					const { searchParams } = new URL(request.url);
					const { type } = parseSearchParams(
						searchParams,
						adminLookupDeleteQuerySchema,
					);
					const table = tableMap[type];
					await db.delete(table).where(eq(table.id, id));
					return Response.json({ success: true });
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to delete lookup" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
