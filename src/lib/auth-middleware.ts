/* eslint-disable eslint-plugin-unicorn(prefer-response-static-json), typescript-eslint(explicit-module-boundary-types) */
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export async function getSession(request: Request): Promise<AuthSession> {
  return auth.api.getSession({ headers: request.headers });
}

export async function requireAuth(request: Request) {
  const session = await getSession(request);
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}

export async function requireAdmin(request: Request) {
  const session = await requireAuth(request);

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, session.user.id),
  });

  if (profile?.role !== "ADMIN") {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session;
}

export async function getOptionalSession(
  request: Request,
): Promise<AuthSession> {
  return getSession(request);
}

export async function getUserProfile(userId: string) {
  return db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
    with: {
      defaultRepetitionUnit: true,
      defaultWeightUnit: true,
      defaultGym: true,
    },
  });
}

export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
  return profile?.role === "ADMIN";
}
