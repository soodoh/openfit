import { query } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";

// List all users with their profiles
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const profiles = await ctx.db.query("userProfiles").collect();

    // Get user details for each profile
    const usersWithProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          email: user?.email ?? "Unknown",
        };
      }),
    );

    return usersWithProfiles;
  },
});

// List all equipment
export const listEquipment = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("equipment").collect();
  },
});

// List all muscle groups
export const listMuscleGroups = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("muscleGroups").collect();
  },
});

// List all categories
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("categories").collect();
  },
});

// List all weight units
export const listWeightUnits = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("weightUnits").collect();
  },
});

// List all repetition units
export const listRepetitionUnits = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("repetitionUnits").collect();
  },
});

// List all exercises with related data
export const listExercises = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const exercises = await ctx.db.query("exercises").collect();

    // Enrich exercises with related data
    const enrichedExercises = await Promise.all(
      exercises.map(async (exercise) => {
        const equipment = exercise.equipmentId
          ? await ctx.db.get(exercise.equipmentId)
          : null;
        const category = await ctx.db.get(exercise.categoryId);

        const primaryMuscles = await Promise.all(
          exercise.primaryMuscleIds.map((id) => ctx.db.get(id)),
        );

        const secondaryMuscles = await Promise.all(
          exercise.secondaryMuscleIds.map((id) => ctx.db.get(id)),
        );

        // Resolve image URLs
        const imageUrls = await Promise.all(
          exercise.imageIds.map((id) => ctx.storage.getUrl(id)),
        );

        return {
          ...exercise,
          equipment,
          category,
          primaryMuscles: primaryMuscles.filter(Boolean),
          secondaryMuscles: secondaryMuscles.filter(Boolean),
          imageUrls,
        };
      }),
    );

    return enrichedExercises;
  },
});
