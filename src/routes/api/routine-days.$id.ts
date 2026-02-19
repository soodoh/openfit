/* eslint-disable eslint(no-console), eslint-plugin-import(prefer-default-export), oxc(no-map-spread), typescript-eslint(no-restricted-types) */
import { createFileRoute } from '@tanstack/react-router'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Helper to get first image URL for an exercise
async function getFirstImageUrl(exerciseId: string): Promise<string | null> {
  const image = await db.query.exerciseImages.findFirst({
    where: eq(schema.exerciseImages.exerciseId, exerciseId),
    orderBy: asc(schema.exerciseImages.order),
  });
  return image?.path ?? null;
}

export const Route = createFileRoute('/api/routine-days/$id')({
  server: {
    handlers: {
      // GET /api/routine-days/[id] - Get single routine day with full data
      GET: async ({ request, params }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {return error;}
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        const routineDay = await db.query.routineDays.findFirst({
          where: eq(schema.routineDays.id, id),
          with: {
            routine: true,
            weekdays: true,
          },
        });

        if (!routineDay) {
          return Response.json({ error: "Routine day not found" }, { status: 404 });
        }

        if (routineDay.userId !== session.user.id) {
          return Response.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Fetch set groups ordered by order field
        const setGroups = await db.query.workoutSetGroups.findMany({
          where: eq(schema.workoutSetGroups.routineDayId, id),
          orderBy: asc(schema.workoutSetGroups.order),
        });

        // Fetch sets for each set group
        const setGroupsWithSets = await Promise.all(
          setGroups.map(async (group) => {
            const sets = await db.query.workoutSets.findMany({
              where: eq(schema.workoutSets.setGroupId, group.id),
              orderBy: asc(schema.workoutSets.order),
              with: {
                exercise: true,
                repetitionUnit: true,
                weightUnit: true,
              },
            });

            // Add image URL to each exercise
            const setsWithImages = await Promise.all(
              sets.map(async (set) => {
                const imageUrl = set.exercise
                  ? await getFirstImageUrl(set.exercise.id)
                  : null;
                return {
                  ...set,
                  exercise: set.exercise ? { ...set.exercise, imageUrl } : null,
                };
              }),
            );

            return {
              ...group,
              sets: setsWithImages,
            };
          }),
        );

        return Response.json({
          ...routineDay,
          weekdays: routineDay.weekdays.map((w) => w.weekday),
          setGroups: setGroupsWithSets,
        });
      },

      // PATCH /api/routine-days/[id] - Update routine day
      PATCH: async ({ request, params }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {return error;}
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        try {
          const routineDay = await db.query.routineDays.findFirst({
            where: eq(schema.routineDays.id, id),
          });

          if (!routineDay) {
            return Response.json({ error: "Routine day not found" }, { status: 404 });
          }

          if (routineDay.userId !== session.user.id) {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
          }

          const body = await request.json();
          const { description, weekdays } = body;

          const trimmedDescription = description?.trim();
          if (description !== undefined && !trimmedDescription) {
            return Response.json(
              { error: "Description cannot be empty" },
              { status: 400 },
            );
          }

          // Validate weekdays
          if (weekdays !== undefined) {
            for (const day of weekdays) {
              if (day < 0 || day > 6 || !Number.isInteger(day)) {
                return Response.json(
                  { error: "Weekdays must be integers between 0 and 6" },
                  { status: 400 },
                );
              }
            }
          }

          // Update routine day
          await db
            .update(schema.routineDays)
            .set({
              ...(trimmedDescription !== undefined && {
                description: trimmedDescription,
              }),
              updatedAt: new Date(),
            })
            .where(eq(schema.routineDays.id, id));

          // Update weekdays if provided
          if (weekdays !== undefined) {
            // Delete existing weekdays
            await db
              .delete(schema.routineDayWeekdays)
              .where(eq(schema.routineDayWeekdays.routineDayId, id));

            // Create new weekdays
            for (const weekday of weekdays) {
              await db.insert(schema.routineDayWeekdays).values({
                id: nanoid(),
                routineDayId: id,
                weekday,
              });
            }
          }

          // Fetch updated routine day
          const updated = await db.query.routineDays.findFirst({
            where: eq(schema.routineDays.id, id),
            with: {
              routine: true,
              weekdays: true,
            },
          });

          return Response.json({
            ...updated,
            weekdays: updated?.weekdays.map((w) => w.weekday) || [],
          });
        } catch (error) {
          console.error("Update routine day error:", error);
          return Response.json(
            { error: "Failed to update routine day" },
            { status: 500 },
          );
        }
      },

      // DELETE /api/routine-days/[id] - Delete routine day (cascades)
      DELETE: async ({ request, params }) => {
        let session;
        try {
          session = await requireAuth(request);
        } catch (error) {
          if (error instanceof Response) {return error;}
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        try {
          const routineDay = await db.query.routineDays.findFirst({
            where: eq(schema.routineDays.id, id),
          });

          if (!routineDay) {
            return Response.json({ error: "Routine day not found" }, { status: 404 });
          }

          if (routineDay.userId !== session.user.id) {
            return Response.json({ error: "Unauthorized" }, { status: 403 });
          }

          // Delete routine day (cascades to weekdays, set groups, sets via FK)
          await db.delete(schema.routineDays).where(eq(schema.routineDays.id, id));

          return Response.json({ success: true });
        } catch (error) {
          console.error("Delete routine day error:", error);
          return Response.json(
            { error: "Failed to delete routine day" },
            { status: 500 },
          );
        }
      },
    },
  },
})
