import { query } from "../_generated/server";
import { getAuthenticatedUserId, getOptionalUserId } from "../lib/auth";

// Check if any users exist in the database (for initial admin setup)
export const hasUsers = query({
  args: {},
  handler: async (ctx) => {
    const firstUser = await ctx.db.query("userProfiles").first();
    return firstUser !== null;
  },
});

// Theme options for the settings dropdown
const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

// Get the current user's profile with units data
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get all units for the dropdowns
    const repetitionUnits = await ctx.db.query("repetitionUnits").collect();
    const weightUnits = await ctx.db.query("weightUnits").collect();

    return {
      profile,
      repetitionUnits,
      weightUnits,
      themeOptions: THEME_OPTIONS,
    };
  },
});

// Check if the current user is an admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOptionalUserId(ctx);
    if (!userId) {
      return false;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile?.role === "ADMIN";
  },
});
