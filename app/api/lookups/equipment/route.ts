import { db } from "@/db";
import * as schema from "@/db/schema";
import { asc } from "drizzle-orm";

// GET /api/lookups/equipment - Get all equipment
export async function GET() {
  const equipment = await db.query.equipment.findMany({
    orderBy: asc(schema.equipment.name),
  });

  return Response.json(equipment);
}
