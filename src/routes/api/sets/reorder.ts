import { createFileRoute } from '@tanstack/react-router';
import { db } from "@/db";
import { schema } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
export const Route = createFileRoute('/api/sets/reorder')({
    server: {
        handlers: {
            // POST /api/sets/reorder - Reorder sets within a set group
            POST: async ({ request }) => {
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
                try {
                    const body = await request.json();
                    const { setGroupId, setIds } = body;
                    if (!setGroupId || !Array.isArray(setIds)) {
                        return Response.json({ error: "setGroupId and setIds array are required" }, { status: 400 });
                    }
                    // Verify set group ownership
                    const setGroup = await db.query.workoutSetGroups.findFirst({
                        where: eq(schema.workoutSetGroups.id, setGroupId),
                    });
                    if (!setGroup || setGroup.userId !== session.user.id) {
                        return Response.json({ error: "Unauthorized" }, { status: 403 });
                    }
                    // Update the order for each set
                    for (const [index, setId] of setIds.entries()) {
                        const set = await db.query.workoutSets.findFirst({
                            where: eq(schema.workoutSets.id, setId),
                        });
                        if (!set) {
                            continue;
                        }
                        if (set.userId !== session.user.id) {
                            return Response.json({ error: "Unauthorized" }, { status: 403 });
                        }
                        await db
                            .update(schema.workoutSets)
                            .set({
                            order: index,
                            updatedAt: new Date(),
                        })
                            .where(eq(schema.workoutSets.id, setId));
                    }
                    return Response.json({ success: true });
                }
                catch {
                    return Response.json({ error: "Failed to reorder sets" }, { status: 500 });
                }
            },
        },
    },
});

export default Route;
