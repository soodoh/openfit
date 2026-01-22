import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

// Create a new workout set
export const create = mutation({
  args: {
    setGroupId: v.id("workoutSetGroups"),
    exerciseId: v.id("exercises"),
    type: v.optional(
      v.union(
        v.literal("NORMAL"),
        v.literal("WARMUP"),
        v.literal("DROPSET"),
        v.literal("FAILURE"),
      ),
    ),
    reps: v.optional(v.number()),
    repetitionUnitId: v.optional(v.id("repetitionUnits")),
    weight: v.optional(v.number()),
    weightUnitId: v.optional(v.id("weightUnits")),
    restTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Verify set group ownership
    const setGroup = await ctx.db.get(args.setGroupId);
    if (!setGroup || setGroup.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Determine if set should be auto-completed:
    // - Routine days: never auto-complete
    // - Active session (no endTime): never auto-complete
    // - Completed session (has endTime): auto-complete
    let shouldAutoComplete = false;
    if (setGroup.sessionId) {
      const session = await ctx.db.get(setGroup.sessionId);
      if (session?.endTime) {
        shouldAutoComplete = true;
      }
    }

    // Get current max order for sets in this group
    const existingSets = await ctx.db
      .query("workoutSets")
      .withIndex("by_set_group", (q) => q.eq("setGroupId", args.setGroupId))
      .collect();

    const maxOrder =
      existingSets.length > 0
        ? Math.max(...existingSets.map((s) => s.order))
        : -1;

    // Get default units if not provided
    const repUnits = await ctx.db.query("repetitionUnits").take(1);
    const weightUnits = await ctx.db.query("weightUnits").take(1);

    const setId = await ctx.db.insert("workoutSets", {
      userId,
      setGroupId: args.setGroupId,
      exerciseId: args.exerciseId,
      type: args.type || "NORMAL",
      order: maxOrder + 1,
      reps: args.reps || 10,
      repetitionUnitId: args.repetitionUnitId || repUnits[0]._id,
      weight: args.weight || 0,
      weightUnitId: args.weightUnitId || weightUnits[0]._id,
      restTime: args.restTime || 0,
      completed: shouldAutoComplete,
      updatedAt: Date.now(),
    });

    return setId;
  },
});

// Update a workout set
export const update = mutation({
  args: {
    id: v.id("workoutSets"),
    type: v.optional(
      v.union(
        v.literal("NORMAL"),
        v.literal("WARMUP"),
        v.literal("DROPSET"),
        v.literal("FAILURE"),
      ),
    ),
    reps: v.optional(v.number()),
    repetitionUnitId: v.optional(v.id("repetitionUnits")),
    weight: v.optional(v.number()),
    weightUnitId: v.optional(v.id("weightUnits")),
    restTime: v.optional(v.number()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const set = await ctx.db.get(args.id);
    if (!set) {
      throw new Error("Set not found");
    }

    if (set.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      ...(args.type !== undefined && { type: args.type }),
      ...(args.reps !== undefined && { reps: args.reps }),
      ...(args.repetitionUnitId !== undefined && {
        repetitionUnitId: args.repetitionUnitId,
      }),
      ...(args.weight !== undefined && { weight: args.weight }),
      ...(args.weightUnitId !== undefined && {
        weightUnitId: args.weightUnitId,
      }),
      ...(args.restTime !== undefined && { restTime: args.restTime }),
      ...(args.completed !== undefined && { completed: args.completed }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete a workout set (also deletes the set group if this was the last set)
export const remove = mutation({
  args: { id: v.id("workoutSets") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const set = await ctx.db.get(args.id);
    if (!set) {
      throw new Error("Set not found");
    }

    if (set.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const setGroupId = set.setGroupId;

    // Delete the set
    await ctx.db.delete(args.id);

    // Check if there are any remaining sets in the set group
    const remainingSets = await ctx.db
      .query("workoutSets")
      .withIndex("by_set_group", (q) => q.eq("setGroupId", setGroupId))
      .first();

    // If no remaining sets, delete the set group
    if (!remainingSets) {
      await ctx.db.delete(setGroupId);
      return { success: true, setGroupDeleted: true };
    }

    return { success: true, setGroupDeleted: false };
  },
});

// Reorder sets within a set group
export const reorder = mutation({
  args: {
    setGroupId: v.id("workoutSetGroups"),
    setIds: v.array(v.id("workoutSets")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Verify set group ownership
    const setGroup = await ctx.db.get(args.setGroupId);
    if (!setGroup || setGroup.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Update the order for each set
    for (const [index, setId] of args.setIds.entries()) {
      const set = await ctx.db.get(setId);
      if (!set) continue;

      if (set.userId !== userId) {
        throw new Error("Unauthorized");
      }

      await ctx.db.patch(setId, {
        order: index,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
