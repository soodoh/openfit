import { db } from "@/db";
import * as schema from "@/db/schema";
import { getOptionalSession, requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

// GET /api/user-profile - Get current user's profile
export async function GET(request: NextRequest) {
  const session = await getOptionalSession(request);
  if (!session) {
    return Response.json(null);
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(schema.userProfiles.userId, session.user.id),
    with: {
      defaultRepetitionUnit: true,
      defaultWeightUnit: true,
      defaultGym: true,
    },
  });

  if (!profile) {
    return Response.json(null);
  }

  return Response.json(profile);
}

// PATCH /api/user-profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      theme,
      defaultRepetitionUnitId,
      defaultWeightUnitId,
      defaultGymId,
    } = body;

    const profile = await db.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.userId, session.user.id),
    });

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    await db
      .update(schema.userProfiles)
      .set({
        ...(theme !== undefined && { theme }),
        ...(defaultRepetitionUnitId !== undefined && {
          defaultRepetitionUnitId,
        }),
        ...(defaultWeightUnitId !== undefined && { defaultWeightUnitId }),
        ...(defaultGymId !== undefined && { defaultGymId }),
        updatedAt: new Date(),
      })
      .where(eq(schema.userProfiles.id, profile.id));

    const updated = await db.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.id, profile.id),
      with: {
        defaultRepetitionUnit: true,
        defaultWeightUnit: true,
        defaultGym: true,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Update profile error:", error);
    return Response.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
