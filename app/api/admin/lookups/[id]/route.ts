import { db } from "@/db";
import {
  categories,
  equipment,
  muscleGroups,
  repetitionUnits,
  weightUnits,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type LookupType =
  | "equipment"
  | "categories"
  | "muscleGroups"
  | "repetitionUnits"
  | "weightUnits";

const tableMap = {
  equipment,
  categories,
  muscleGroups,
  repetitionUnits,
  weightUnits,
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const type = body.type as LookupType;

    if (!type || !tableMap[type]) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const table = tableMap[type];

    await db.update(table).set({ name: body.name }).where(eq(table.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating lookup:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update lookup" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as LookupType;

    if (!type || !tableMap[type]) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const table = tableMap[type];

    await db.delete(table).where(eq(table.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lookup:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete lookup" },
      { status: 500 },
    );
  }
}
