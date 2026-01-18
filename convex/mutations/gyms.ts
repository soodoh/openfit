import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

export const update = mutation({
  args: {
    id: v.id("gyms"),
    name: v.string(),
    equipmentIds: v.array(v.id("equipment")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const gym = await ctx.db.get(args.id);
    if (!gym || gym.userId !== userId) {
      throw new Error("Gym not found or unauthorized");
    }

    if (!args.name.trim()) {
      throw new Error("Gym name is required");
    }

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      equipmentIds: args.equipmentIds,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    equipmentIds: v.array(v.id("equipment")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    if (!args.name.trim()) {
      throw new Error("Gym name is required");
    }

    const gymId = await ctx.db.insert("gyms", {
      userId,
      name: args.name.trim(),
      equipmentIds: args.equipmentIds,
      updatedAt: Date.now(),
    });

    return gymId;
  },
});

export const remove = mutation({
  args: {
    id: v.id("gyms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const gym = await ctx.db.get(args.id);
    if (!gym || gym.userId !== userId) {
      throw new Error("Gym not found or unauthorized");
    }

    const userGyms = await ctx.db
      .query("gyms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (userGyms.length <= 1) {
      throw new Error("Cannot delete your last gym");
    }

    // Reset default gym if this was the default
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile?.defaultGymId === args.id) {
      await ctx.db.patch(profile._id, {
        defaultGymId: undefined,
      });
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});
