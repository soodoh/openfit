import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

const ThemeEnum = v.union(
  v.literal("light"),
  v.literal("dark"),
  v.literal("system"),
);

// Update user profile settings
export const update = mutation({
  args: {
    defaultRepetitionUnitId: v.id("repetitionUnits"),
    defaultWeightUnitId: v.id("weightUnits"),
    theme: ThemeEnum,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Get existing profile
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        defaultRepetitionUnitId: args.defaultRepetitionUnitId,
        defaultWeightUnitId: args.defaultWeightUnitId,
        theme: args.theme,
      });
      return existingProfile._id;
    } else {
      // Create new profile (fallback in case it wasn't created during registration)
      const profileId = await ctx.db.insert("userProfiles", {
        userId,
        role: "USER",
        defaultRepetitionUnitId: args.defaultRepetitionUnitId,
        defaultWeightUnitId: args.defaultWeightUnitId,
        theme: args.theme,
      });
      return profileId;
    }
  },
});

// Set default gym for exercise filtering
export const setDefaultGym = mutation({
  args: {
    gymId: v.optional(v.id("gyms")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    if (args.gymId) {
      const gym = await ctx.db.get(args.gymId);
      if (!gym || gym.userId !== userId) {
        throw new Error("Gym not found or unauthorized");
      }
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        defaultGymId: args.gymId ?? undefined,
      });
    }

    return args.gymId;
  },
});

// Internal mutation to create profile for new users (called from auth callback)
export const createForNewUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      return existingProfile._id;
    }

    // Get default units
    const defaultRepUnit = await ctx.db
      .query("repetitionUnits")
      .withIndex("by_name", (q) => q.eq("name", "Repetitions"))
      .first();

    const defaultWeightUnit = await ctx.db
      .query("weightUnits")
      .withIndex("by_name", (q) => q.eq("name", "lb"))
      .first();

    if (!defaultRepUnit || !defaultWeightUnit) {
      throw new Error(
        "Default units not found. Please seed the database first.",
      );
    }

    // Create user profile with defaults
    const profileId = await ctx.db.insert("userProfiles", {
      userId: args.userId,
      role: "USER",
      defaultRepetitionUnitId: defaultRepUnit._id,
      defaultWeightUnitId: defaultWeightUnit._id,
      theme: "system",
    });

    return profileId;
  },
});
