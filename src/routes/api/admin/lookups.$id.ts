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
import { eq } from "drizzle-orm";

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

export const Route = createFileRoute('/api/admin/lookups/$id')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          await requireAdmin(request);
          const { id } = params;
          const body = await request.json();
          const type = body.type as LookupType;

          if (!type || !tableMap[type]) {
            return Response.json({ error: "Invalid type" }, { status: 400 });
          }

          const table = tableMap[type];

          await db.update(table).set({ name: body.name }).where(eq(table.id, id));

          return Response.json({ success: true });
        } catch (error) {
          console.error("Error updating lookup:", error);
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to update lookup" },
            { status: 500 },
          );
        }
      },

      DELETE: async ({ request, params }) => {
        try {
          await requireAdmin(request);
          const { id } = params;
          const { searchParams } = new URL(request.url);
          const type = searchParams.get("type") as LookupType;

          if (!type || !tableMap[type]) {
            return Response.json({ error: "Invalid type" }, { status: 400 });
          }

          const table = tableMap[type];

          await db.delete(table).where(eq(table.id, id));

          return Response.json({ success: true });
        } catch (error) {
          console.error("Error deleting lookup:", error);
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to delete lookup" },
            { status: 500 },
          );
        }
      },
    },
  },
})
