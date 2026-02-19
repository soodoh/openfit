/* eslint-disable eslint-plugin-import(prefer-default-export) */
import { db } from "@/db";
import * as schema from "@/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { asc } from "drizzle-orm";

// GET /api/lookups/equipment - Get all equipment
export const Route = createFileRoute("/api/lookups/equipment")({
  server: {
    handlers: {
      GET: async () => {
        const equipment = await db.query.equipment.findMany({
          orderBy: asc(schema.equipment.name),
        });

        return Response.json(equipment);
      },
    },
  },
});
