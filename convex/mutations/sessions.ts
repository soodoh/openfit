import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

// Create a new workout session (optionally from a template)
export const create = mutation({
  args: {
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    impression: v.optional(v.number()),
    templateId: v.optional(v.id("routineDays")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // If templateId provided, fetch the template
    let routineDay = null;
    if (args.templateId) {
      routineDay = await ctx.db.get(args.templateId);
      if (!routineDay) {
        throw new Error("Template not found");
      }
    }

    // Derive session name from template if not provided
    const name = (args.name?.trim() || routineDay?.description || "").trim();

    // Create the session
    const sessionId = await ctx.db.insert("workoutSessions", {
      userId,
      name,
      notes: args.notes?.trim() || "",
      startTime: args.startTime || Date.now(),
      endTime: args.endTime,
      impression: args.impression,
      templateId: args.templateId,
    });

    // If no template, return the session
    if (!routineDay) {
      return sessionId;
    }

    // Clone sets from routine day template
    const setGroups = await ctx.db
      .query("workoutSetGroups")
      .withIndex("by_routine_day", (q) =>
        q.eq("routineDayId", args.templateId!),
      )
      .collect();

    // Sort by order
    setGroups.sort((a, b) => a.order - b.order);

    // Clone each set group
    for (const [setGroupOrder, setGroupTemplate] of setGroups.entries()) {
      const newSetGroupId = await ctx.db.insert("workoutSetGroups", {
        userId,
        sessionId,
        routineDayId: undefined,
        type: setGroupTemplate.type,
        order: setGroupOrder,
        comment: setGroupTemplate.comment,
        updatedAt: Date.now(),
      });

      // Clone sets in this set group
      const sets = await ctx.db
        .query("workoutSets")
        .withIndex("by_set_group", (q) =>
          q.eq("setGroupId", setGroupTemplate._id),
        )
        .collect();

      // Sort by order
      sets.sort((a, b) => a.order - b.order);

      for (const [setOrder, setTemplate] of sets.entries()) {
        await ctx.db.insert("workoutSets", {
          userId,
          setGroupId: newSetGroupId,
          exerciseId: setTemplate.exerciseId,
          order: setOrder,
          type: setTemplate.type,
          weight: setTemplate.weight,
          weightUnitId: setTemplate.weightUnitId,
          reps: setTemplate.reps,
          repetitionUnitId: setTemplate.repetitionUnitId,
          restTime: setTemplate.restTime,
          completed: false, // New session starts with incomplete sets
          updatedAt: Date.now(),
        });
      }
    }

    return sessionId;
  },
});

// Update a workout session
export const update = mutation({
  args: {
    id: v.id("workoutSessions"),
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
    impression: v.optional(v.number()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      ...(args.name !== undefined && { name: args.name.trim() }),
      ...(args.notes !== undefined && { notes: args.notes.trim() }),
      ...(args.impression !== undefined && { impression: args.impression }),
      ...(args.startTime !== undefined && { startTime: args.startTime }),
      ...(args.endTime !== undefined && { endTime: args.endTime }),
    });

    return args.id;
  },
});

// Delete a workout session (with cascade delete)
export const remove = mutation({
  args: { id: v.id("workoutSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Cascade delete: Get all set groups for this session
    const setGroups = await ctx.db
      .query("workoutSetGroups")
      .withIndex("by_session", (q) => q.eq("sessionId", args.id))
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

    // Delete the session
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
