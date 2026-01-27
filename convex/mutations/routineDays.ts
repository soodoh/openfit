import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

// Create a new routine day
export const create = mutation({
  args: {
    routineId: v.id("routines"),
    description: v.string(),
    weekdays: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Verify routine ownership
    const routine = await ctx.db.get(args.routineId);
    if (!routine || routine.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const description = args.description.trim();
    if (!description) {
      throw new Error("Description cannot be empty");
    }

    // Validate weekdays are in valid range (0-6)
    for (const day of args.weekdays) {
      if (day < 0 || day > 6 || !Number.isInteger(day)) {
        throw new Error("Weekdays must be integers between 0 and 6");
      }
    }

    const routineDayId = await ctx.db.insert("routineDays", {
      routineId: args.routineId,
      userId,
      description,
      weekdays: args.weekdays,
      updatedAt: Date.now(),
    });

    return routineDayId;
  },
});

// Update a routine day
export const update = mutation({
  args: {
    id: v.id("routineDays"),
    description: v.optional(v.string()),
    weekdays: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const routineDay = await ctx.db.get(args.id);
    if (!routineDay) {
      throw new Error("Routine day not found");
    }

    if (routineDay.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const description = args.description?.trim();
    if (args.description !== undefined && !description) {
      throw new Error("Description cannot be empty");
    }

    // Validate weekdays are in valid range (0-6)
    if (args.weekdays) {
      for (const day of args.weekdays) {
        if (day < 0 || day > 6 || !Number.isInteger(day)) {
          throw new Error("Weekdays must be integers between 0 and 6");
        }
      }
    }

    await ctx.db.patch(args.id, {
      ...(description !== undefined && { description }),
      ...(args.weekdays !== undefined && { weekdays: args.weekdays }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete a routine day (with cascade delete)
export const remove = mutation({
  args: { id: v.id("routineDays") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const routineDay = await ctx.db.get(args.id);
    if (!routineDay) {
      throw new Error("Routine day not found");
    }

    if (routineDay.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Cascade delete: Get all set groups for this routine day
    const setGroups = await ctx.db
      .query("workoutSetGroups")
      .withIndex("by_routine_day", (q) => q.eq("routineDayId", args.id))
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

    // Delete the routine day
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
