/**
 * Authentication configuration for @convex-dev/auth
 *
 * IMPORTANT: OAuth providers are configured at module load time (during deployment).
 * This means credentials must be available as environment variables when deploying.
 *
 * The database stores:
 * - Provider metadata (display name, enabled state, order)
 * - Encrypted credentials (for admin UI management)
 *
 * Environment variables still needed for OAuth flow:
 * - AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
 * - AUTH_GITHUB_ID, AUTH_GITHUB_SECRET
 * - AUTH_FACEBOOK_ID, AUTH_FACEBOOK_SECRET
 * - AUTH_DISCORD_ID, AUTH_DISCORD_SECRET
 * - AUTH_APPLE_ID, AUTH_APPLE_SECRET
 * - AUTH_MICROSOFT_ENTRA_ID_ID, AUTH_MICROSOFT_ENTRA_ID_SECRET
 * - AUTH_OIDC_ISSUER, AUTH_OIDC_ID, AUTH_OIDC_SECRET
 *
 * For encryption of database-stored credentials:
 * - AUTH_ENCRYPTION_KEY (generate with: openssl rand -base64 32)
 */

import Apple from "@auth/core/providers/apple";
import Discord from "@auth/core/providers/discord";
import Facebook from "@auth/core/providers/facebook";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import MicrosoftEntraId from "@auth/core/providers/microsoft-entra-id";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

// Build list of optional OAuth providers based on environment variables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const optionalProviders: any[] = [];

// Built-in OAuth providers - auto-enabled when env vars present
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  optionalProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  optionalProviders.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}
if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  optionalProviders.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  );
}
if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
  optionalProviders.push(
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  );
}
if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  optionalProviders.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  );
}
if (
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET
) {
  optionalProviders.push(
    MicrosoftEntraId({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    }),
  );
}

// Generic OIDC provider
if (
  process.env.AUTH_OIDC_ISSUER &&
  process.env.AUTH_OIDC_ID &&
  process.env.AUTH_OIDC_SECRET
) {
  optionalProviders.push({
    id: "oidc",
    name: "OIDC",
    type: "oidc" as const,
    issuer: process.env.AUTH_OIDC_ISSUER,
    clientId: process.env.AUTH_OIDC_ID,
    clientSecret: process.env.AUTH_OIDC_SECRET,
  });
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password<DataModel>(), ...optionalProviders],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      // Only create profile for new users (not updates)
      if (existingUserId) {
        return;
      }

      // Use an internal mutation to create the profile
      await ctx.scheduler.runAfter(
        0,
        internal.mutations.userProfiles.createForNewUser,
        {
          userId,
        },
      );
    },
  },
});
