import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
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

// Internal mutation to seed default provider entries
export const seedDefaultProviders = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if any providers already exist
    const existingProviders = await ctx.db.query("authProviders").collect();
    if (existingProviders.length > 0) {
      return; // Already seeded
    }

    const now = Date.now();
    const defaultProviders = [
      { providerId: "google", type: "google" as const, displayName: "Google" },
      { providerId: "github", type: "github" as const, displayName: "GitHub" },
      {
        providerId: "facebook",
        type: "facebook" as const,
        displayName: "Facebook",
      },
      {
        providerId: "discord",
        type: "discord" as const,
        displayName: "Discord",
      },
      { providerId: "apple", type: "apple" as const, displayName: "Apple" },
      {
        providerId: "microsoft",
        type: "microsoft" as const,
        displayName: "Microsoft",
      },
    ];

    for (let i = 0; i < defaultProviders.length; i++) {
      const provider = defaultProviders[i];
      await ctx.db.insert("authProviders", {
        providerId: provider.providerId,
        type: provider.type,
        displayName: provider.displayName,
        enabled: false,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update provider order (for drag and drop reordering)
export const updateProviderOrder = mutation({
  args: {
    providerIds: v.array(v.id("authProviders")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    for (let i = 0; i < args.providerIds.length; i++) {
      await ctx.db.patch(args.providerIds[i], {
        order: i,
        updatedAt: now,
      });
    }
  },
});
