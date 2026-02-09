import { db } from "@/db";
import * as schema from "@/db/schema";
import { asc } from "drizzle-orm";

// GET /api/lookups/categories - Get all categories
export async function GET() {
  const categories = await db.query.categories.findMany({
    orderBy: asc(schema.categories.name),
  });

  return Response.json(categories);
}
