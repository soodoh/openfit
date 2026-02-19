import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import {
  categories,
  equipment,
  muscleGroups,
  repetitionUnits,
  weightUnits,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { createId } from "@paralleldrive/cuid2";
import { asc, count, like } from "drizzle-orm";

type LookupType =
  | "equipment"
  | "categories"
  | "muscleGroups"
  | "repetitionUnits"
  | "weightUnits";

const tableMap = {
  equipment,
  categories,
  muscleGroups,
  repetitionUnits,
  weightUnits,
};

export const Route = createFileRoute('/api/admin/lookups')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
          const { searchParams } = new URL(request.url);
          const type = searchParams.get("type") as LookupType;

          if (!type || !tableMap[type]) {
            return Response.json({ error: "Invalid type" }, { status: 400 });
          }

          const page = Math.max(1, Number(searchParams.get("page")) || 1);
          const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 10);
          const search = searchParams.get("search")?.trim() || "";

          const table = tableMap[type];
          const conditions = search ? like(table.name, `%${search}%`) : undefined;

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
          console.error("Error fetching lookups:", error);
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to fetch lookups" },
            { status: 500 },
          );
        }
      },

      POST: async ({ request }) => {
        try {
          await requireAdmin(request);
          const body = await request.json();
          const type = body.type as LookupType;

          if (!type || !tableMap[type]) {
            return Response.json({ error: "Invalid type" }, { status: 400 });
          }

          const table = tableMap[type];
          const id = createId();

          await db.insert(table).values({
            id,
            name: body.name,
          });

          return Response.json({ id });
        } catch (error) {
          console.error("Error creating lookup:", error);
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to create lookup" },
            { status: 500 },
          );
        }
      },
    },
  },
})
