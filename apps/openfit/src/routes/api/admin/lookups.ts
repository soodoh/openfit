import { createId } from "@paralleldrive/cuid2";
import { createFileRoute } from "@tanstack/react-router";
import { asc, count, like } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { parseJsonBody, parseSearchParams } from "@/lib/request-helpers";
import {
	adminLookupListQuerySchema,
	adminLookupMutationSchema,
} from "@/lib/request-schemas";

const tableMap = {
	equipment: schema.equipment,
	categories: schema.categories,
	muscleGroups: schema.muscleGroups,
	repetitionUnits: schema.repetitionUnits,
	weightUnits: schema.weightUnits,
};

function getLookupTable(type: keyof typeof tableMap) {
	return tableMap[type];
}

export const Route = createFileRoute("/api/admin/lookups")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				try {
					await requireAdmin(request);
					const { searchParams } = new URL(request.url);
					const query = parseSearchParams(
						searchParams,
						adminLookupListQuerySchema,
					);
					const { type, search, page, pageSize } = query;
					const table = getLookupTable(type);
					const conditions = search
						? like(table.name, `%${search}%`)
						: undefined;
					const [totalResult] = await db
						.select({ count: count() })
						.from(table)
						.where(conditions);
					const items = await db
						.select()
						.from(table)
						.where(conditions)
						.orderBy(asc(table.name))
						.limit(pageSize)
						.offset((page - 1) * pageSize);
					return Response.json({
						items,
						total: totalResult.count,
						page,
						pageSize,
					});
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to fetch lookups" },
						{ status: 500 },
					);
				}
			},
			POST: async ({ request }: { request: Request }) => {
				try {
					await requireAdmin(request);
					const body = await parseJsonBody(request, adminLookupMutationSchema);
					const table = getLookupTable(body.type);
					const id = createId();
					await db.insert(table).values({
						id,
						name: body.name,
					});
					return Response.json({ id });
				} catch (error) {
					if (error instanceof Response) {
						return error;
					}
					return Response.json(
						{ error: "Failed to create lookup" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
