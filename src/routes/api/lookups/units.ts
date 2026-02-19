import { db } from "@/db";
import { schema } from "@/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { asc } from "drizzle-orm";
// GET /api/lookups/units - Get all units (repetition and weight)
export const Route = createFileRoute("/api/lookups/units")({
  server: {
    handlers: {
      GET: async () => {
        const [repetitionUnits, weightUnits] = await Promise.all([
          db.query.repetitionUnits.findMany({
            orderBy: asc(schema.repetitionUnits.name),
          }),
          db.query.weightUnits.findMany({
            orderBy: asc(schema.weightUnits.name),
          }),
        ]);
        return Response.json({ repetitionUnits, weightUnits });
      },
    },
  },
});

export default Route;
