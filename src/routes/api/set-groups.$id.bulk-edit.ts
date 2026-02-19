import { createFileRoute } from '@tanstack/react-router';
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
export const Route = createFileRoute('/api/set-groups/$id/bulk-edit')({
    server: {
        handlers: {
            // POST /api/set-groups/[id]/bulk-edit - Bulk edit all sets in a set group
            POST: async ({ request, params }) => {
                let session;
                try {
                    session = await requireAuth(request);
                }
                catch (error) {
                    if (error instanceof Response) {
                        return error;
                    }
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
                    const { reps, weight, repetitionUnitId, weightUnitId, restTime } = body;
                    // Get all sets in this set group
                    const sets = await db.query.workoutSets.findMany({
                        where: eq(schema.workoutSets.setGroupId, id),
                    });
                    // Update each set
                    for (const set of sets) {
                        await db
                            .update(schema.workoutSets)
                            .set({
                            ...(reps !== undefined && { reps }),
                            ...(weight !== undefined && { weight }),
                            ...(repetitionUnitId !== undefined && { repetitionUnitId }),
                            ...(weightUnitId !== undefined && { weightUnitId }),
                            ...(restTime !== undefined && { restTime }),
                            updatedAt: new Date(),
                        })
                            .where(eq(schema.workoutSets.id, set.id));
                    }
                    return Response.json({ success: true });
                }
                catch {
                    return Response.json({ error: "Failed to bulk edit" }, { status: 500 });
                }
            },
        },
    },
});

export default Route;
