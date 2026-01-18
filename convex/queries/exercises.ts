import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

// Level enum (still used as a direct field)
const ExerciseLevelEnum = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("expert"),
);

// Search exercises by name with pagination and optional filters
export const search = query({
  args: {
    searchTerm: v.string(),
    paginationOpts: paginationOptsValidator,
    equipmentId: v.optional(v.id("equipment")),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
    level: v.optional(ExerciseLevelEnum),
    categoryId: v.optional(v.id("categories")),
    primaryMuscleId: v.optional(v.id("muscleGroups")),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const paginatedExercises = await ctx.db
      .query("exercises")
      .withSearchIndex("search_exercise", (q) => {
        let searchQuery = q.search("name", args.searchTerm);

        if (args.equipmentId !== undefined) {
          searchQuery = searchQuery.eq("equipmentId", args.equipmentId);
        }
        if (args.level !== undefined) {
          searchQuery = searchQuery.eq("level", args.level);
        }
        if (args.categoryId !== undefined) {
          searchQuery = searchQuery.eq("categoryId", args.categoryId);
        }

        return searchQuery;
      })
      .paginate(args.paginationOpts);

    // Apply client-side filtering for primaryMuscleId and equipmentIds
    const needsFiltering =
      args.primaryMuscleId !== undefined ||
      (args.equipmentIds !== undefined && args.equipmentIds.length > 0);

    if (needsFiltering) {
      const filteredPage = paginatedExercises.page.filter((exercise) => {
        if (
          args.primaryMuscleId !== undefined &&
          !exercise.primaryMuscleIds.includes(args.primaryMuscleId)
        ) {
          return false;
        }
        if (args.equipmentIds !== undefined && args.equipmentIds.length > 0) {
          if (
            exercise.equipmentId !== undefined &&
            !args.equipmentIds.includes(exercise.equipmentId)
          ) {
            return false;
          }
        }
        return true;
      });
      return {
        ...paginatedExercises,
        page: filteredPage,
      };
    }

    return paginatedExercises;
  },
});

// Get count of exercises matching search term with optional filters
export const searchCount = query({
  args: {
    searchTerm: v.string(),
    equipmentId: v.optional(v.id("equipment")),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
    level: v.optional(ExerciseLevelEnum),
    categoryId: v.optional(v.id("categories")),
    primaryMuscleId: v.optional(v.id("muscleGroups")),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return 0;
    }

    const results = await ctx.db
      .query("exercises")
      .withSearchIndex("search_exercise", (q) => {
        let searchQuery = q.search("name", args.searchTerm);

        if (args.equipmentId !== undefined) {
          searchQuery = searchQuery.eq("equipmentId", args.equipmentId);
        }
        if (args.level !== undefined) {
          searchQuery = searchQuery.eq("level", args.level);
        }
        if (args.categoryId !== undefined) {
          searchQuery = searchQuery.eq("categoryId", args.categoryId);
        }

        return searchQuery;
      })
      .collect();

    // Apply client-side filtering for primaryMuscleId and equipmentIds
    const needsFiltering =
      args.primaryMuscleId !== undefined ||
      (args.equipmentIds !== undefined && args.equipmentIds.length > 0);

    if (needsFiltering) {
      return results.filter((exercise) => {
        if (
          args.primaryMuscleId !== undefined &&
          !exercise.primaryMuscleIds.includes(args.primaryMuscleId)
        ) {
          return false;
        }
        if (args.equipmentIds !== undefined && args.equipmentIds.length > 0) {
          if (
            exercise.equipmentId !== undefined &&
            !args.equipmentIds.includes(exercise.equipmentId)
          ) {
            return false;
          }
        }
        return true;
      }).length;
    }

    return results.length;
  },
});

// List exercises with pagination and optional filters (sorted by name ascending)
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    equipmentId: v.optional(v.id("equipment")),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
    level: v.optional(ExerciseLevelEnum),
    categoryId: v.optional(v.id("categories")),
    primaryMuscleId: v.optional(v.id("muscleGroups")),
  },
  handler: async (ctx, args) => {
    const paginatedExercises = await ctx.db
      .query("exercises")
      .withIndex("by_name")
      .order("asc")
      .paginate(args.paginationOpts);

    // Apply client-side filtering (since regular indexes don't support multiple filter fields)
    const hasFilters =
      args.equipmentId !== undefined ||
      args.equipmentIds !== undefined ||
      args.level !== undefined ||
      args.categoryId !== undefined ||
      args.primaryMuscleId !== undefined;

    if (hasFilters) {
      const filteredPage = paginatedExercises.page.filter((exercise) => {
        // Gym equipment filter (multiple equipment IDs)
        // NOTE: Bodyweight exercises (equipmentId === undefined) are always included
        // regardless of gym equipment selection, as they require no equipment
        if (args.equipmentIds !== undefined && args.equipmentIds.length > 0) {
          if (
            exercise.equipmentId !== undefined &&
            !args.equipmentIds.includes(exercise.equipmentId)
          ) {
            return false;
          }
        }
        if (
          args.equipmentId !== undefined &&
          exercise.equipmentId !== args.equipmentId
        ) {
          return false;
        }
        if (args.level !== undefined && exercise.level !== args.level) {
          return false;
        }
        if (
          args.categoryId !== undefined &&
          exercise.categoryId !== args.categoryId
        ) {
          return false;
        }
        if (
          args.primaryMuscleId !== undefined &&
          !exercise.primaryMuscleIds.includes(args.primaryMuscleId)
        ) {
          return false;
        }
        return true;
      });
      return {
        ...paginatedExercises,
        page: filteredPage,
      };
    }

    return paginatedExercises;
  },
});

// Simple search for autocomplete (returns array, not paginated)
export const searchSimple = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const results = await ctx.db
      .query("exercises")
      .withSearchIndex("search_exercise", (q) =>
        q.search("name", args.searchTerm),
      )
      .take(20);

    return results;
  },
});

// Get total count of exercises
export const count = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    return exercises.length;
  },
});

// Get count of exercises with filters applied (for browse mode)
export const listCount = query({
  args: {
    equipmentId: v.optional(v.id("equipment")),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
    level: v.optional(ExerciseLevelEnum),
    categoryId: v.optional(v.id("categories")),
    primaryMuscleId: v.optional(v.id("muscleGroups")),
  },
  handler: async (ctx, args) => {
    const exercises = await ctx.db.query("exercises").collect();

    const hasFilters =
      args.equipmentId !== undefined ||
      args.equipmentIds !== undefined ||
      args.level !== undefined ||
      args.categoryId !== undefined ||
      args.primaryMuscleId !== undefined;

    if (!hasFilters) {
      return exercises.length;
    }

    const filtered = exercises.filter((exercise) => {
      // Gym equipment filter (multiple equipment IDs)
      // NOTE: Bodyweight exercises (equipmentId === undefined) are always included
      // regardless of gym equipment selection, as they require no equipment
      if (args.equipmentIds !== undefined && args.equipmentIds.length > 0) {
        if (
          exercise.equipmentId !== undefined &&
          !args.equipmentIds.includes(exercise.equipmentId)
        ) {
          return false;
        }
      }
      if (
        args.equipmentId !== undefined &&
        exercise.equipmentId !== args.equipmentId
      ) {
        return false;
      }
      if (args.level !== undefined && exercise.level !== args.level) {
        return false;
      }
      if (
        args.categoryId !== undefined &&
        exercise.categoryId !== args.categoryId
      ) {
        return false;
      }
      if (
        args.primaryMuscleId !== undefined &&
        !exercise.primaryMuscleIds.includes(args.primaryMuscleId)
      ) {
        return false;
      }
      return true;
    });

    return filtered.length;
  },
});

// Get a single exercise by ID
export const get = query({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.id);
    return exercise;
  },
});
