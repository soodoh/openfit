import { db } from "@/db";
import * as schema from "@/db/schema";
import { asc } from "drizzle-orm";

// GET /api/lookups/muscle-groups - Get all muscle groups
export async function GET() {
  const muscleGroups = await db.query.muscleGroups.findMany({
    orderBy: asc(schema.muscleGroups.name),
  });

  return Response.json(muscleGroups);
}
