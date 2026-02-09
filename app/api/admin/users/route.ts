import { db } from "@/db";
import { userProfiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { count, eq, like } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 10);
    const search = searchParams.get("search")?.trim() || "";

    const conditions = search ? like(users.email, `%${search}%`) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id))
      .where(conditions);

    const items = await db
      .select({
        id: userProfiles.id,
        userId: userProfiles.userId,
        email: users.email,
        role: userProfiles.role,
      })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id))
      .where(conditions)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      items,
      total: totalResult.count,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
