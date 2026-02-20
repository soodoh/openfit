import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
export const Route = createFileRoute("/api/gyms")({
  server: {
    handlers: {
      // GET /api/gyms - List user's gyms
      GET: async ({ request }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {
            return error;
          }
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const gyms = await db.query.gyms.findMany({
          where: eq(schema.gyms.userId, session.user.id),
          orderBy: asc(schema.gyms.name),
          with: {
            equipment: {
              with: {
                equipment: true,
              },
            },
          },
        });
        // Transform to include equipment IDs array
        const gymsWithEquipment = gyms.map((gym) =>
          Object.assign(gym, {
            equipmentIds: gym.equipment.map((ge) => ge.equipmentId),
          }),
        );
        return Response.json(gymsWithEquipment);
      },
      // POST /api/gyms - Create a new gym
      POST: async ({ request }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {
            return error;
          }
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        try {
          const body = await request.json();
          const { name, equipmentIds = [] } = body;
          const trimmedName = name?.trim();
          if (!trimmedName) {
            return Response.json(
              { error: "Name is required" },
              { status: 400 },
            );
          }
          // Create gym
          const gymId = nanoid();
          await db.insert(schema.gyms).values({
            id: gymId,
            userId: session.user.id,
            name: trimmedName,
          });
          // Add equipment
          for (const equipmentId of equipmentIds) {
            await db.insert(schema.gymEquipment).values({
              id: nanoid(),
              gymId,
              equipmentId,
            });
          }
          const gym = await db.query.gyms.findFirst({
            where: eq(schema.gyms.id, gymId),
            with: {
              equipment: {
                with: {
                  equipment: true,
                },
              },
            },
          });
          return Response.json(
            {
              ...gym,
              equipmentIds: gym?.equipment.map((ge) => ge.equipmentId) || [],
            },
            { status: 201 },
          );
        } catch {
          return Response.json(
            { error: "Failed to create gym" },
            { status: 500 },
          );
        }
      },
    },
  },
});
export default Route;
