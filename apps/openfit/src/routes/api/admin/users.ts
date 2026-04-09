import { createFileRoute } from "@tanstack/react-router";
import { count, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { parseSearchParams } from "@/lib/request-helpers";
import { adminUserListQuerySchema } from "@/lib/request-schemas";
export const Route = createFileRoute("/api/admin/users")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				try {
					await requireAdmin(request);
					const { searchParams } = new URL(request.url);
					const { page, pageSize, search } = parseSearchParams(
						searchParams,
						adminUserListQuerySchema,
					);
					const conditions = search
						? like(schema.users.email, `%${search}%`)
						: undefined;
					const [totalResult] = await db
						.select({ count: count() })
						.from(schema.userProfiles)
						.innerJoin(
							schema.users,
							eq(schema.userProfiles.userId, schema.users.id),
						)
						.where(conditions);
					const items = await db
						.select({
							id: schema.userProfiles.id,
							userId: schema.userProfiles.userId,
							email: schema.users.email,
							role: schema.userProfiles.role,
						})
						.from(schema.userProfiles)
						.innerJoin(
							schema.users,
							eq(schema.userProfiles.userId, schema.users.id),
						)
						.where(conditions)
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
						{ error: "Failed to fetch users" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

export default Route;
