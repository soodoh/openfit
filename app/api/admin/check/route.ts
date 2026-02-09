import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

// GET /api/admin/check - Check if current user is admin
export async function GET(request: NextRequest) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ isAdmin: false }, { status: 401 });
  }

  const profile = await db.query.userProfiles.findFirst({
    where: eq(schema.userProfiles.userId, session.user.id),
  });

  return Response.json({ isAdmin: profile?.role === "ADMIN" });
}
