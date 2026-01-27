import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { query, QueryCtx } from "../_generated/server";

// Helper to resolve image storage IDs to URLs
async function getImageUrls(
  ctx: QueryCtx,
  imageIds: Id<"_storage">[],
): Promise<(string | null)[]> {
  return Promise.all(imageIds.map((id) => ctx.storage.getUrl(id)));
}

// Helper to add image URLs to an exercise
async function withImageUrls<T extends Doc<"exercises">>(
  ctx: QueryCtx,
  exercise: T,
): Promise<T & { imageUrls: (string | null)[] }> {
  const imageUrls = await getImageUrls(ctx, exercise.imageIds);
  return { ...exercise, imageUrls };
}

// Helper to add first image URL to exercises (for lists/thumbnails)
async function withFirstImageUrl<T extends Doc<"exercises">>(
  ctx: QueryCtx,
  exercise: T,
): Promise<T & { imageUrl: string | null }> {
  const imageUrl =
    exercise.imageIds.length > 0
      ? await ctx.storage.getUrl(exercise.imageIds[0])
      : null;
  return { ...exercise, imageUrl };
}

// Helper to add first image URL to multiple exercises
async function withFirstImageUrls<T extends Doc<"exercises">>(
  ctx: QueryCtx,
  exercises: T[],
): Promise<(T & { imageUrl: string | null })[]> {
  return Promise.all(exercises.map((e) => withFirstImageUrl(ctx, e)));
}

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

    let filteredPage = paginatedExercises.page;
    if (needsFiltering) {
      filteredPage = paginatedExercises.page.filter((exercise) => {
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
    }

    // Add image URLs
    const pageWithImages = await withFirstImageUrls(ctx, filteredPage);

    return {
      ...paginatedExercises,
      page: pageWithImages,
    };
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

    let filteredPage = paginatedExercises.page;
    if (hasFilters) {
      filteredPage = paginatedExercises.page.filter((exercise) => {
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
    }

    // Add image URLs
    const pageWithImages = await withFirstImageUrls(ctx, filteredPage);

    return {
      ...paginatedExercises,
      page: pageWithImages,
    };
  },
});

// Simple search for autocomplete (returns array, not paginated)
export const searchSimple = query({
  args: {
    searchTerm: v.optional(v.string()),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.searchTerm?.trim()) {
      // Search by name
      results = await ctx.db
        .query("exercises")
        .withSearchIndex("search_exercise", (q) =>
          q.search("name", args.searchTerm!),
        )
        .take(50); // Fetch more to account for filtering
    } else {
      // No search term - return exercises sorted by name
      results = await ctx.db.query("exercises").withIndex("by_name").take(50);
    }

    // Apply equipment filter if provided
    // NOTE: Bodyweight exercises (equipmentId === undefined) are always included
    let filtered = results;
    if (args.equipmentIds !== undefined && args.equipmentIds.length > 0) {
      filtered = results.filter((exercise) => {
        // Bodyweight exercises are always included
        if (exercise.equipmentId === undefined) {
          return true;
        }
        return args.equipmentIds!.includes(exercise.equipmentId);
      });
    }

    // Add first image URL for thumbnails
    return withFirstImageUrls(ctx, filtered.slice(0, 20));
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

// Get a single exercise by ID (with image URLs)
export const get = query({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.id);
    if (!exercise) return null;
    return withImageUrls(ctx, exercise);
  },
});

// Search for similar exercises (same primary muscles, filtered by equipment)
export const searchSimilar = query({
  args: {
    searchTerm: v.optional(v.string()),
    equipmentIds: v.optional(v.array(v.id("equipment"))),
    primaryMuscleIds: v.array(v.id("muscleGroups")),
    excludeExerciseId: v.optional(v.id("exercises")),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.searchTerm?.trim()) {
      // Search by name
      results = await ctx.db
        .query("exercises")
        .withSearchIndex("search_exercise", (q) =>
          q.search("name", args.searchTerm!),
        )
        .take(100); // Fetch more to account for filtering
    } else {
      // No search term - return exercises sorted by name
      results = await ctx.db.query("exercises").withIndex("by_name").take(100);
    }

    // Filter by primary muscles - must share at least one primary muscle
    let filtered = results.filter((exercise) => {
      // Exclude the current exercise
      if (args.excludeExerciseId && exercise._id === args.excludeExerciseId) {
        return false;
      }
      // Must share at least one primary muscle
      return exercise.primaryMuscleIds.some((muscleId) =>
        args.primaryMuscleIds.includes(muscleId),
      );
    });

    // Apply equipment filter if provided
    // NOTE: Bodyweight exercises (equipmentId === undefined) are always included
    if (args.equipmentIds !== undefined && args.equipmentIds.length > 0) {
      filtered = filtered.filter((exercise) => {
        // Bodyweight exercises are always included
        if (exercise.equipmentId === undefined) {
          return true;
        }
        return args.equipmentIds!.includes(exercise.equipmentId);
      });
    }

    // Add first image URL for thumbnails
    return withFirstImageUrls(ctx, filtered.slice(0, 20));
  },
});
