import { db } from "@/db";
import { schema } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
export async function getSession(request: Request): Promise<AuthSession> {
  return auth.api.getSession({ headers: request.headers });
}
export async function requireAuth(
  request: Request,
): Promise<NonNullable<AuthSession>> {
  const session = await getSession(request);
  if (!session) {
    // oxlint-disable-next-line typescript-eslint/only-throw-error -- TanStack Start pattern
    throw Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
export async function requireAdmin(
  request: Request,
): Promise<NonNullable<AuthSession>> {
  const session = await requireAuth(request);
  const profile = await db.query.userProfiles.findFirst({
    where: eq(schema.userProfiles.userId, session.user.id),
  });
  if (profile?.role !== "ADMIN") {
    // oxlint-disable-next-line typescript-eslint/only-throw-error -- TanStack Start pattern
    throw Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
export async function getOptionalSession(
  request: Request,
): Promise<AuthSession> {
  return getSession(request);
}
export async function getUserProfile(
  userId: string,
): Promise<
  Awaited<ReturnType<typeof db.query.userProfiles.findFirst>> | undefined
> {
  return db.query.userProfiles.findFirst({
    where: eq(schema.userProfiles.userId, userId),
    with: {
      defaultRepetitionUnit: true,
      defaultWeightUnit: true,
      defaultGym: true,
    },
  });
}
export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(schema.userProfiles.userId, userId),
  });
  return profile?.role === "ADMIN";
}
