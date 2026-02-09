import { db } from "@/db";
import * as schema from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { nanoid } from "nanoid";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.AUTH_GOOGLE_ID && {
      google: {
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      },
    }),
    ...(process.env.AUTH_GITHUB_ID && {
      github: {
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      },
    }),
    ...(process.env.AUTH_DISCORD_ID && {
      discord: {
        clientId: process.env.AUTH_DISCORD_ID,
        clientSecret: process.env.AUTH_DISCORD_SECRET!,
      },
    }),
  },
  plugins: [
    ...(process.env.AUTH_OIDC_CLIENT_ID
      ? [
          genericOAuth({
            config: [
              {
                providerId: "oidc",
                clientId: process.env.AUTH_OIDC_CLIENT_ID,
                clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET!,
                discoveryUrl: `${process.env.AUTH_OIDC_ISSUER}/.well-known/openid-configuration`,
                scopes: ["openid", "email", "profile"],
                pkce: true,
              },
            ],
          }),
        ]
      : []),
  ],
  user: {
    additionalFields: {},
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  callbacks: {
    session: async ({
      session,
      user,
    }: {
      session: { user: Record<string, unknown>; [key: string]: unknown };
      user: { id: string };
    }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const repUnits = db
            .select()
            .from(schema.repetitionUnits)
            .limit(1)
            .all();
          const weightUnits = db
            .select()
            .from(schema.weightUnits)
            .limit(1)
            .all();

          db.insert(schema.userProfiles)
            .values({
              id: nanoid(),
              userId: user.id,
              role: "USER",
              defaultRepetitionUnitId: repUnits[0]?.id ?? null,
              defaultWeightUnitId: weightUnits[0]?.id ?? null,
              theme: "system",
            })
            .run();
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
