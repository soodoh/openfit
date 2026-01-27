import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";

const AuthProviderTypeEnum = v.union(
  v.literal("google"),
  v.literal("github"),
  v.literal("facebook"),
  v.literal("discord"),
  v.literal("apple"),
  v.literal("microsoft"),
  v.literal("oidc"),
);

// Create a new auth provider
export const createAuthProvider = mutation({
  args: {
    providerId: v.string(),
    type: AuthProviderTypeEnum,
    displayName: v.string(),
    enabled: v.boolean(),
    issuer: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const displayName = args.displayName.trim();
    if (!displayName) {
      throw new Error("Display name is required");
    }

    // Check for duplicate providerId
    const existing = await ctx.db
      .query("authProviders")
      .withIndex("by_providerId", (q) => q.eq("providerId", args.providerId))
      .first();

    if (existing) {
      throw new Error("Provider with this ID already exists");
    }

    // For OIDC providers, issuer is required
    if (args.type === "oidc" && !args.issuer?.trim()) {
      throw new Error("Issuer URL is required for OIDC providers");
    }

    // Get max order for new provider
    const providers = await ctx.db.query("authProviders").collect();
    const maxOrder = providers.reduce((max, p) => Math.max(max, p.order), -1);

    const now = Date.now();
    return await ctx.db.insert("authProviders", {
      providerId: args.providerId,
      type: args.type,
      displayName,
      enabled: args.enabled,
      issuer: args.issuer?.trim(),
      iconUrl: args.iconUrl?.trim(),
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an auth provider
export const updateAuthProvider = mutation({
  args: {
    id: v.id("authProviders"),
    displayName: v.string(),
    enabled: v.boolean(),
    issuer: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error("Provider not found");
    }

    const displayName = args.displayName.trim();
    if (!displayName) {
      throw new Error("Display name is required");
    }

    // For OIDC providers, issuer is required
    if (provider.type === "oidc" && !args.issuer?.trim()) {
      throw new Error("Issuer URL is required for OIDC providers");
    }

    await ctx.db.patch(args.id, {
      displayName,
      enabled: args.enabled,
      issuer: args.issuer?.trim(),
      iconUrl: args.iconUrl?.trim(),
      order: args.order ?? provider.order,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete an auth provider
export const deleteAuthProvider = mutation({
  args: { id: v.id("authProviders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error("Provider not found");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Toggle auth provider enabled/disabled
export const toggleAuthProvider = mutation({
  args: {
    id: v.id("authProviders"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const provider = await ctx.db.get(args.id);
    if (!provider) {
      throw new Error("Provider not found");
    }

    await ctx.db.patch(args.id, {
      enabled: args.enabled,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
