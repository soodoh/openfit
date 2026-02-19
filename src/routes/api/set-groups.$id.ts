import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";

export const Route = createFileRoute('/api/set-groups/$id')({
  server: {
    handlers: {
      // PATCH /api/set-groups/[id] - Update set group
      PATCH: async ({ request, params }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) return error;
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        try {
          const setGroup = await db.query.workoutSetGroups.findFirst({
            where: eq(schema.workoutSetGroups.id, id),
          });

          if (!setGroup) {
            return Response.json({ error: "Set group not found" }, { status: 404 });
          }

          if (setGroup.userId !== session.user.id) {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
          }

          const body = await request.json();
          const { type, comment } = body;

          await db
            .update(schema.workoutSetGroups)
            .set({
              ...(type !== undefined && { type }),
              ...(comment !== undefined && { comment }),
              updatedAt: new Date(),
            })
            .where(eq(schema.workoutSetGroups.id, id));

          const updated = await db.query.workoutSetGroups.findFirst({
            where: eq(schema.workoutSetGroups.id, id),
          });

          return Response.json(updated);
        } catch (error) {
          console.error("Update set group error:", error);
          return Response.json(
            { error: "Failed to update set group" },
            { status: 500 },
          );
        }
      },

      // DELETE /api/set-groups/[id] - Delete set group (cascades sets)
      DELETE: async ({ request, params }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) return error;
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        try {
          const setGroup = await db.query.workoutSetGroups.findFirst({
            where: eq(schema.workoutSetGroups.id, id),
          });

          if (!setGroup) {
            return Response.json({ error: "Set group not found" }, { status: 404 });
          }

          if (setGroup.userId !== session.user.id) {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
          }

          // Delete set group (cascades to sets via FK)
          await db
            .delete(schema.workoutSetGroups)
            .where(eq(schema.workoutSetGroups.id, id));

          return Response.json({ success: true });
        } catch (error) {
          console.error("Delete set group error:", error);
          return Response.json(
            { error: "Failed to delete set group" },
            { status: 500 },
          );
        }
      },
    },
  },
})
