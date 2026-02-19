import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";

export const Route = createFileRoute('/api/admin/users/$id')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          await requireAdmin(request);
          const { id } = params;
          const body = await request.json();

          const updated = await db
            .update(userProfiles)
            .set({ role: body.role })
            .where(eq(userProfiles.id, id))
            .returning();

          if (updated.length === 0) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          return Response.json(updated[0]);
        } catch (error) {
          console.error("Error updating user:", error);
          if (error instanceof Error && error.message === "Unauthorized") {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          if (error instanceof Error && error.message === "Forbidden") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          return Response.json(
            { error: "Failed to update user" },
            { status: 500 },
          );
        }
      },
    },
  },
})
