import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUserId } from "../lib/auth";

export const get = query({
  args: {
    id: v.id("gyms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const gym = await ctx.db.get(args.id);

    if (!gym || gym.userId !== userId) {
      return null;
    }

    return gym;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);

    const gyms = await ctx.db
      .query("gyms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return gyms;
  },
});
