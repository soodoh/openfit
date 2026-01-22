import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

// Create a new set group with sets
export const create = mutation({
  args: {
    sessionOrDayId: v.union(v.id("routineDays"), v.id("workoutSessions")),
    isSession: v.boolean(),
    type: v.union(v.literal("NORMAL"), v.literal("SUPERSET")),
    exerciseId: v.id("exercises"),
    numSets: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Type-safe ID extraction based on isSession flag
    const sessionId: Id<"workoutSessions"> | undefined = args.isSession
      ? (args.sessionOrDayId as Id<"workoutSessions">)
      : undefined;
    const routineDayId: Id<"routineDays"> | undefined = args.isSession
      ? undefined
      : (args.sessionOrDayId as Id<"routineDays">);

    // Get the current max order for set groups
    const existingSetGroups = sessionId
      ? await ctx.db
          .query("workoutSetGroups")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .collect()
      : await ctx.db
          .query("workoutSetGroups")
          .withIndex("by_routine_day", (q) =>
            q.eq("routineDayId", routineDayId),
          )
          .collect();

    const maxOrder =
      existingSetGroups.length > 0
        ? Math.max(...existingSetGroups.map((g) => g.order))
        : -1;

    // Get default units (first ones)
    const repUnits = await ctx.db.query("repetitionUnits").take(1);
    const weightUnits = await ctx.db.query("weightUnits").take(1);

    if (repUnits.length === 0 || weightUnits.length === 0) {
      throw new Error("Units not found - please seed the database first");
    }

    // Create the set group
    const setGroupId = await ctx.db.insert("workoutSetGroups", {
      userId,
      routineDayId,
      sessionId,
      type: args.type,
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });

    // Create the sets
    for (let i = 0; i < args.numSets; i++) {
      await ctx.db.insert("workoutSets", {
        userId,
        setGroupId,
        exerciseId: args.exerciseId,
        type: "NORMAL",
        order: i,
        reps: 10, // Default values
        repetitionUnitId: repUnits[0]._id,
        weight: 0,
        weightUnitId: weightUnits[0]._id,
        restTime: 0,
        completed: false,
        updatedAt: Date.now(),
      });
    }

    return setGroupId;
  },
});

// Update a set group
export const update = mutation({
  args: {
    id: v.id("workoutSetGroups"),
    type: v.optional(v.union(v.literal("NORMAL"), v.literal("SUPERSET"))),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const setGroup = await ctx.db.get(args.id);
    if (!setGroup) {
      throw new Error("Set group not found");
    }

    if (setGroup.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      ...(args.type !== undefined && { type: args.type }),
      ...(args.comment !== undefined && { comment: args.comment }),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete a set group (with cascade delete of sets)
export const remove = mutation({
  args: { id: v.id("workoutSetGroups") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const setGroup = await ctx.db.get(args.id);
    if (!setGroup) {
      throw new Error("Set group not found");
    }

    if (setGroup.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Cascade delete: Get all sets in this set group
    const sets = await ctx.db
      .query("workoutSets")
      .withIndex("by_set_group", (q) => q.eq("setGroupId", args.id))
      .collect();

    for (const set of sets) {
      await ctx.db.delete(set._id);
    }

    // Delete the set group
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Reorder set groups
export const reorder = mutation({
  args: {
    sessionOrDayId: v.union(v.id("routineDays"), v.id("workoutSessions")),
    isSession: v.boolean(),
    setGroupIds: v.array(v.id("workoutSetGroups")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Update the order for each set group
    for (const [index, setGroupId] of args.setGroupIds.entries()) {
      const setGroup = await ctx.db.get(setGroupId);
      if (!setGroup) continue;

      if (setGroup.userId !== userId) {
        throw new Error("Unauthorized");
      }

      await ctx.db.patch(setGroupId, {
        order: index,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Replace exercise in all sets of a set group
export const replaceExercise = mutation({
  args: {
    id: v.id("workoutSetGroups"),
    newExerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const setGroup = await ctx.db.get(args.id);
    if (!setGroup) {
      throw new Error("Set group not found");
    }

    if (setGroup.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Get all sets in this set group
    const sets = await ctx.db
      .query("workoutSets")
      .withIndex("by_set_group", (q) => q.eq("setGroupId", args.id))
      .collect();

    // Update each set with the new exercise
    for (const set of sets) {
      await ctx.db.patch(set._id, {
        exerciseId: args.newExerciseId,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Bulk edit all sets in a set group
export const bulkEdit = mutation({
  args: {
    id: v.id("workoutSetGroups"),
    reps: v.optional(v.number()),
    weight: v.optional(v.number()),
    repetitionUnitId: v.optional(v.id("repetitionUnits")),
    weightUnitId: v.optional(v.id("weightUnits")),
    restTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const setGroup = await ctx.db.get(args.id);
    if (!setGroup) {
      throw new Error("Set group not found");
    }

    if (setGroup.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Get all sets in this set group
    const sets = await ctx.db
      .query("workoutSets")
      .withIndex("by_set_group", (q) => q.eq("setGroupId", args.id))
      .collect();

    // Update each set
    for (const set of sets) {
      await ctx.db.patch(set._id, {
        ...(args.reps !== undefined && { reps: args.reps }),
        ...(args.weight !== undefined && { weight: args.weight }),
        ...(args.repetitionUnitId !== undefined && {
          repetitionUnitId: args.repetitionUnitId,
        }),
        ...(args.weightUnitId !== undefined && {
          weightUnitId: args.weightUnitId,
        }),
        ...(args.restTime !== undefined && { restTime: args.restTime }),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
