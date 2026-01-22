import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUserId, getOptionalUserId } from "../lib/auth";

// List workout sessions with pagination
export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Get paginated sessions ordered by most recent start time
    const paginatedSessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user_start", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    // Fetch set groups with sets and exercises for each session
    const sessionsWithData = await Promise.all(
      paginatedSessions.page.map(async (session) => {
        const setGroups = await ctx.db
          .query("workoutSetGroups")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        // Sort by order
        setGroups.sort((a, b) => a.order - b.order);

        // Fetch sets for each set group
        const setGroupsWithSets = await Promise.all(
          setGroups.map(async (group) => {
            const sets = await ctx.db
              .query("workoutSets")
              .withIndex("by_set_group", (q) => q.eq("setGroupId", group._id))
              .collect();

            sets.sort((a, b) => a.order - b.order);

            // Fetch exercise and units for each set
            const setsWithData = await Promise.all(
              sets.map(async (set) => {
                const exercise = await ctx.db.get(set.exerciseId);
                const repetitionUnit = await ctx.db.get(set.repetitionUnitId);
                const weightUnit = await ctx.db.get(set.weightUnitId);

                return {
                  ...set,
                  exercise,
                  repetitionUnit,
                  weightUnit,
                };
              }),
            );

            return {
              ...group,
              sets: setsWithData,
            };
          }),
        );

        return {
          ...session,
          setGroups: setGroupsWithSets,
        };
      }),
    );

    return {
      ...paginatedSessions,
      page: sessionsWithData,
    };
  },
});

// List all workout sessions for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Get sessions ordered by most recent start time
    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user_start", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Fetch set groups with sets and exercises for each session
    const sessionsWithData = await Promise.all(
      sessions.map(async (session) => {
        const setGroups = await ctx.db
          .query("workoutSetGroups")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        // Sort by order
        setGroups.sort((a, b) => a.order - b.order);

        // Fetch sets for each set group
        const setGroupsWithSets = await Promise.all(
          setGroups.map(async (group) => {
            const sets = await ctx.db
              .query("workoutSets")
              .withIndex("by_set_group", (q) => q.eq("setGroupId", group._id))
              .collect();

            sets.sort((a, b) => a.order - b.order);

            // Fetch exercise and units for each set
            const setsWithData = await Promise.all(
              sets.map(async (set) => {
                const exercise = await ctx.db.get(set.exerciseId);
                const repetitionUnit = await ctx.db.get(set.repetitionUnitId);
                const weightUnit = await ctx.db.get(set.weightUnitId);

                return {
                  ...set,
                  exercise,
                  repetitionUnit,
                  weightUnit,
                };
              }),
            );

            return {
              ...group,
              sets: setsWithData,
            };
          }),
        );

        return {
          ...session,
          setGroups: setGroupsWithSets,
        };
      }),
    );

    return sessionsWithData;
  },
});

// Get a single workout session by ID
export const get = query({
  args: { id: v.id("workoutSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const session = await ctx.db.get(args.id);

    if (!session) {
      return null;
    }

    // Check ownership
    if (session.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Fetch set groups with sets and exercises
    const setGroups = await ctx.db
      .query("workoutSetGroups")
      .withIndex("by_session", (q) => q.eq("sessionId", args.id))
      .collect();

    setGroups.sort((a, b) => a.order - b.order);

    const setGroupsWithSets = await Promise.all(
      setGroups.map(async (group) => {
        const sets = await ctx.db
          .query("workoutSets")
          .withIndex("by_set_group", (q) => q.eq("setGroupId", group._id))
          .collect();

        sets.sort((a, b) => a.order - b.order);

        const setsWithData = await Promise.all(
          sets.map(async (set) => {
            const exercise = await ctx.db.get(set.exerciseId);
            const repetitionUnit = await ctx.db.get(set.repetitionUnitId);
            const weightUnit = await ctx.db.get(set.weightUnitId);

            return {
              ...set,
              exercise,
              repetitionUnit,
              weightUnit,
            };
          }),
        );

        return {
          ...group,
          sets: setsWithData,
        };
      }),
    );

    return {
      ...session,
      setGroups: setGroupsWithSets,
    };
  },
});

// Get total count of sessions for the current user
export const count = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);

    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return sessions.length;
  },
});

// Search workout sessions by name with pagination
export const search = query({
  args: {
    searchTerm: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    if (!args.searchTerm.trim()) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    // Fetch paginated results using search index with user filter
    const paginatedSessions = await ctx.db
      .query("workoutSessions")
      .withSearchIndex("search_name", (q) =>
        q.search("name", args.searchTerm).eq("userId", userId),
      )
      .paginate(args.paginationOpts);

    // Fetch set groups with sets and exercises for each session in the page
    const sessionsWithData = await Promise.all(
      paginatedSessions.page.map(async (session) => {
        const setGroups = await ctx.db
          .query("workoutSetGroups")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        setGroups.sort((a, b) => a.order - b.order);

        const setGroupsWithSets = await Promise.all(
          setGroups.map(async (group) => {
            const sets = await ctx.db
              .query("workoutSets")
              .withIndex("by_set_group", (q) => q.eq("setGroupId", group._id))
              .collect();

            sets.sort((a, b) => a.order - b.order);

            const setsWithData = await Promise.all(
              sets.map(async (set) => {
                const exercise = await ctx.db.get(set.exerciseId);
                const repetitionUnit = await ctx.db.get(set.repetitionUnitId);
                const weightUnit = await ctx.db.get(set.weightUnitId);

                return {
                  ...set,
                  exercise,
                  repetitionUnit,
                  weightUnit,
                };
              }),
            );

            return {
              ...group,
              sets: setsWithData,
            };
          }),
        );

        return {
          ...session,
          setGroups: setGroupsWithSets,
        };
      }),
    );

    return {
      ...paginatedSessions,
      page: sessionsWithData,
    };
  },
});

// Get count of sessions matching search term
export const searchCount = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    if (!args.searchTerm.trim()) {
      return 0;
    }

    const results = await ctx.db
      .query("workoutSessions")
      .withSearchIndex("search_name", (q) =>
        q.search("name", args.searchTerm).eq("userId", userId),
      )
      .collect();

    return results.length;
  },
});

// List sessions within a date range (for calendar view)
export const listByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Get sessions that started within the date range
    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user_start", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startTime"), args.startDate),
          q.lt(q.field("startTime"), args.endDate),
        ),
      )
      .collect();

    // Sort by start time descending
    sessions.sort((a, b) => b.startTime - a.startTime);

    // Fetch set groups with sets and exercises for each session
    const sessionsWithData = await Promise.all(
      sessions.map(async (session) => {
        const setGroups = await ctx.db
          .query("workoutSetGroups")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        setGroups.sort((a, b) => a.order - b.order);

        const setGroupsWithSets = await Promise.all(
          setGroups.map(async (group) => {
            const sets = await ctx.db
              .query("workoutSets")
              .withIndex("by_set_group", (q) => q.eq("setGroupId", group._id))
              .collect();

            sets.sort((a, b) => a.order - b.order);

            const setsWithData = await Promise.all(
              sets.map(async (set) => {
                const exercise = await ctx.db.get(set.exerciseId);
                const repetitionUnit = await ctx.db.get(set.repetitionUnitId);
                const weightUnit = await ctx.db.get(set.weightUnitId);

                return {
                  ...set,
                  exercise,
                  repetitionUnit,
                  weightUnit,
                };
              }),
            );

            return {
              ...group,
              sets: setsWithData,
            };
          }),
        );

        return {
          ...session,
          setGroups: setGroupsWithSets,
        };
      }),
    );

    return sessionsWithData;
  },
});

// Get the current active session (one without an endTime)
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return null;
    }

    // Find most recent session without endTime
    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter to sessions without endTime and get the most recent
    const activeSessions = sessions
      .filter((s) => !s.endTime)
      .sort((a, b) => b.startTime - a.startTime);

    if (activeSessions.length === 0) {
      return null;
    }

    const session = activeSessions[0];

    // Fetch set groups with sets and exercises
    const setGroups = await ctx.db
      .query("workoutSetGroups")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    setGroups.sort((a, b) => a.order - b.order);

    const setGroupsWithSets = await Promise.all(
      setGroups.map(async (group) => {
        const sets = await ctx.db
          .query("workoutSets")
          .withIndex("by_set_group", (q) => q.eq("setGroupId", group._id))
          .collect();

        sets.sort((a, b) => a.order - b.order);

        const setsWithData = await Promise.all(
          sets.map(async (set) => {
            const exercise = await ctx.db.get(set.exerciseId);
            const repetitionUnit = await ctx.db.get(set.repetitionUnitId);
            const weightUnit = await ctx.db.get(set.weightUnitId);

            return {
              ...set,
              exercise,
              repetitionUnit,
              weightUnit,
            };
          }),
        );

        return {
          ...group,
          sets: setsWithData,
        };
      }),
    );

    return {
      ...session,
      setGroups: setGroupsWithSets,
    };
  },
});
