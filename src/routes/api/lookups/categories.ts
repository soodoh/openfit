import { db } from "@/db";
import { schema } from "@/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { asc } from "drizzle-orm";
// GET /api/lookups/categories - Get all categories
export const Route = createFileRoute("/api/lookups/categories")({
  server: {
    handlers: {
      GET: async () => {
        const categories = await db.query.categories.findMany({
          orderBy: asc(schema.categories.name),
        });
        return Response.json(categories);
      },
    },
  },
});

export default Route;
