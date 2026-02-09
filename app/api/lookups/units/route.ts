import { db } from "@/db";
import * as schema from "@/db/schema";
import { asc } from "drizzle-orm";

// GET /api/lookups/units - Get all units (repetition and weight)
export async function GET() {
  const [repetitionUnits, weightUnits] = await Promise.all([
    db.query.repetitionUnits.findMany({
      orderBy: asc(schema.repetitionUnits.name),
    }),
    db.query.weightUnits.findMany({
      orderBy: asc(schema.weightUnits.name),
    }),
  ]);

  return Response.json({ repetitionUnits, weightUnits });
}
