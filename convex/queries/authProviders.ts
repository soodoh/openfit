import { query } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";

// Provider type definitions for env var mapping
export const PROVIDER_ENV_VARS: Record<
  string,
  { id: string; secret: string; issuer?: string }
> = {
  google: { id: "AUTH_GOOGLE_ID", secret: "AUTH_GOOGLE_SECRET" },
  github: { id: "AUTH_GITHUB_ID", secret: "AUTH_GITHUB_SECRET" },
  facebook: { id: "AUTH_FACEBOOK_ID", secret: "AUTH_FACEBOOK_SECRET" },
  discord: { id: "AUTH_DISCORD_ID", secret: "AUTH_DISCORD_SECRET" },
  apple: { id: "AUTH_APPLE_ID", secret: "AUTH_APPLE_SECRET" },
  microsoft: {
    id: "AUTH_MICROSOFT_ENTRA_ID_ID",
    secret: "AUTH_MICROSOFT_ENTRA_ID_SECRET",
  },
};

// OIDC env vars
export const OIDC_ENV_VARS = {
  id: "AUTH_OIDC_ID",
  secret: "AUTH_OIDC_SECRET",
  issuer: "AUTH_OIDC_ISSUER",
};

// List all auth providers (admin only)
export const listAuthProviders = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const providers = await ctx.db.query("authProviders").collect();

    // Sort by order
    return providers.sort((a, b) => a.order - b.order);
  },
});

// Get enabled providers for login page (public, no sensitive info)
export const getEnabledProviders = query({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db
      .query("authProviders")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();

    // Return only public info needed for login UI
    return providers
      .sort((a, b) => a.order - b.order)
      .map((provider) => ({
        _id: provider._id,
        providerId: provider.providerId,
        type: provider.type,
        displayName: provider.displayName,
        iconUrl: provider.iconUrl,
      }));
  },
});

// Check which providers have their env vars configured (admin only)
export const getConfiguredProviders = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const configured: Record<string, boolean> = {};

    // Check built-in OAuth providers
    for (const [type, envVars] of Object.entries(PROVIDER_ENV_VARS)) {
      configured[type] = !!(
        process.env[envVars.id] && process.env[envVars.secret]
      );
    }

    // Check OIDC provider
    configured["oidc"] = !!(
      process.env[OIDC_ENV_VARS.id] &&
      process.env[OIDC_ENV_VARS.secret] &&
      process.env[OIDC_ENV_VARS.issuer]
    );

    return configured;
  },
});

// Get available provider types that can be added (admin only)
export const getAvailableProviderTypes = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const existingProviders = await ctx.db.query("authProviders").collect();

    const existingIds = new Set(existingProviders.map((p) => p.providerId));

    // All available providers in a flat list
    const allProviders = [
      { providerId: "google", type: "google" as const, label: "Google" },
      { providerId: "github", type: "github" as const, label: "GitHub" },
      { providerId: "facebook", type: "facebook" as const, label: "Facebook" },
      { providerId: "discord", type: "discord" as const, label: "Discord" },
      { providerId: "apple", type: "apple" as const, label: "Apple" },
      {
        providerId: "microsoft",
        type: "microsoft" as const,
        label: "Microsoft",
      },
      {
        providerId: "oidc",
        type: "oidc" as const,
        label: "Generic OIDC Provider",
      },
    ].filter((p) => !existingIds.has(p.providerId));

    return allProviders;
  },
});
