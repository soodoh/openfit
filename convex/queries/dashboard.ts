import { query } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

// Get dashboard statistics for the current user
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Get all completed sessions (with endTime)
    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const completedSessions = sessions.filter((s) => s.endTime);
    const totalSessions = completedSessions.length;

    // Sessions this week
    const now = Date.now();
    const startOfWeek =
      now - ((new Date().getDay() + 6) % 7) * 24 * 60 * 60 * 1000;
    const startOfWeekMidnight = new Date(startOfWeek);
    startOfWeekMidnight.setHours(0, 0, 0, 0);
    const thisWeekSessions = completedSessions.filter(
      (s) => s.startTime >= startOfWeekMidnight.getTime(),
    ).length;

    // Calculate streak (consecutive days with workouts)
    let currentStreak = 0;
    if (completedSessions.length > 0) {
      // Sort sessions by start time descending
      const sortedSessions = [...completedSessions].sort(
        (a, b) => b.startTime - a.startTime,
      );

      // Get unique workout days
      const workoutDays = new Set(
        sortedSessions.map((s) => {
          const date = new Date(s.startTime);
          return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        }),
      );

      // Check streak starting from today or yesterday
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

      // Start counting from today if there's a workout, otherwise from yesterday
      let checkDate = new Date(today);
      if (!workoutDays.has(todayKey)) {
        if (workoutDays.has(yesterdayKey)) {
          checkDate = new Date(yesterday);
        } else {
          // No recent workouts, streak is 0
          currentStreak = 0;
        }
      }

      if (workoutDays.has(todayKey) || workoutDays.has(yesterdayKey)) {
        // Count consecutive days
        while (true) {
          const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
          if (workoutDays.has(key)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Get routine count
    const routines = await ctx.db
      .query("routines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const totalRoutines = routines.length;

    return {
      totalSessions,
      thisWeekSessions,
      currentStreak,
      totalRoutines,
    };
  },
});

// Get recent completed sessions for the dashboard
export const getRecentSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Get sessions ordered by most recent start time
    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user_start", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Filter to completed sessions (with endTime) and take first 5
    const recentSessions = sessions.filter((s) => s.endTime).slice(0, 5);

    // Fetch set groups with sets and exercises for each session
    const sessionsWithData = await Promise.all(
      recentSessions.map(async (session) => {
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
