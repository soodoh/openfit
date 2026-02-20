import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { count, eq, like } from "drizzle-orm";
export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
          const { searchParams } = new URL(request.url);
          const page = Math.max(1, Number(searchParams.get("page")) || 1);
          const pageSize = Math.max(
            1,
            Number(searchParams.get("pageSize")) || 10,
          );
          const search = searchParams.get("search")?.trim() || "";
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
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
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
