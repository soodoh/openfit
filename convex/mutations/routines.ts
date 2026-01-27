import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

// Create a new routine
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Name cannot be empty");
    }

    const routineId = await ctx.db.insert("routines", {
      userId,
      name,
      description: args.description?.trim(),
      updatedAt: Date.now(),
    });

    return routineId;
  },
});

// Update a routine
export const update = mutation({
  args: {
    id: v.id("routines"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const routine = await ctx.db.get(args.id);
    if (!routine) {
      throw new Error("Routine not found");
    }

    if (routine.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const name = args.name?.trim();
    if (args.name !== undefined && !name) {
      throw new Error("Name cannot be empty");
    }

    await ctx.db.patch(args.id, {
      ...(name !== undefined && { name }),
      ...(args.description !== undefined && {
        description: args.description?.trim(),
      }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete a routine (with cascade delete of routine days)
export const remove = mutation({
  args: { id: v.id("routines") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const routine = await ctx.db.get(args.id);
    if (!routine) {
      throw new Error("Routine not found");
    }

    if (routine.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Cascade delete: Get all routine days for this routine
    const routineDays = await ctx.db
      .query("routineDays")
      .withIndex("by_routine", (q) => q.eq("routineId", args.id))
      .collect();

    // Delete each routine day (which will cascade to set groups and sets)
    for (const day of routineDays) {
      // Get set groups for this routine day
      const setGroups = await ctx.db
        .query("workoutSetGroups")
        .withIndex("by_routine_day", (q) => q.eq("routineDayId", day._id))
        .collect();

      // Delete sets in each set group
      for (const group of setGroups) {
        const sets = await ctx.db
          .query("workoutSets")
          .withIndex("by_set_group", (q) => q.eq("setGroupId", group._id))
          .collect();

        for (const set of sets) {
          await ctx.db.delete(set._id);
        }

        await ctx.db.delete(group._id);
      }

      await ctx.db.delete(day._id);
    }

    // Delete the routine
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
