import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUserId, getOptionalUserId } from "../lib/auth";

// Get a single routine day with all its data
export const get = query({
  args: { id: v.id("routineDays") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const routineDay = await ctx.db.get(args.id);

    if (!routineDay) {
      return null;
    }

    // Check ownership
    if (routineDay.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Fetch routine info
    const routine = await ctx.db.get(routineDay.routineId);

    // Fetch set groups ordered by order field
    const setGroups = await ctx.db
      .query("workoutSetGroups")
      .withIndex("by_routine_day", (q) => q.eq("routineDayId", args.id))
      .collect();

    // Sort by order field
    setGroups.sort((a, b) => a.order - b.order);

    // Fetch sets for each set group
    const setGroupsWithSets = await Promise.all(
      setGroups.map(async (group) => {
        const sets = await ctx.db
          .query("workoutSets")
          .withIndex("by_set_group", (q) => q.eq("setGroupId", group._id))
          .collect();

        // Sort by order field
        sets.sort((a, b) => a.order - b.order);

        // Fetch exercise info for each set
        const setsWithExercise = await Promise.all(
          sets.map(async (set) => {
            const exercise = await ctx.db.get(set.exerciseId);
            const repetitionUnit = await ctx.db.get(set.repetitionUnitId);
            const weightUnit = await ctx.db.get(set.weightUnitId);

            // Get first image URL for exercise
            const imageUrl =
              exercise && exercise.imageIds.length > 0
                ? await ctx.storage.getUrl(exercise.imageIds[0])
                : null;

            return {
              ...set,
              exercise: exercise ? { ...exercise, imageUrl } : null,
              repetitionUnit,
              weightUnit,
            };
          }),
        );

        return {
          ...group,
          sets: setsWithExercise,
        };
      }),
    );

    return {
      ...routineDay,
      routine,
      setGroups: setGroupsWithSets,
    };
  },
});

// Search routine days by description
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return [];
    }

    // If no search term, return recent templates
    if (!args.searchTerm.trim()) {
      const recentDays = await ctx.db
        .query("routineDays")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(10);

      // Fetch routine info for each day
      const withRoutines = await Promise.all(
        recentDays.map(async (day) => {
          const routine = await ctx.db.get(day.routineId);
          return {
            ...day,
            routine,
          };
        }),
      );

      return withRoutines;
    }

    // Search by description
    const results = await ctx.db
      .query("routineDays")
      .withSearchIndex("search_description", (q) =>
        q.search("description", args.searchTerm).eq("userId", userId),
      )
      .take(20);

    // Fetch routine info for each day
    const withRoutines = await Promise.all(
      results.map(async (day) => {
        const routine = await ctx.db.get(day.routineId);
        return {
          ...day,
          routine,
        };
      }),
    );

    return withRoutines;
  },
});
