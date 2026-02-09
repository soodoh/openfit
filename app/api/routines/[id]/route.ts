import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// Helper to get routine days with weekdays
async function getRoutineDaysWithWeekdays(routineId: string) {
  const days = await db.query.routineDays.findMany({
    where: eq(schema.routineDays.routineId, routineId),
    with: {
      weekdays: true,
    },
  });

  return days.map((day) => ({
    ...day,
    weekdays: day.weekdays.map((w) => w.weekday),
  }));
}

// GET /api/routines/[id] - Get single routine
export async function GET(request: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const routine = await db.query.routines.findFirst({
    where: eq(schema.routines.id, id),
  });

  if (!routine) {
    return Response.json({ error: "Routine not found" }, { status: 404 });
  }

  if (routine.userId !== session.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const routineDays = await getRoutineDaysWithWeekdays(id);

  return Response.json({
    ...routine,
    routineDays,
  });
}

// PATCH /api/routines/[id] - Update routine
export async function PATCH(request: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const routine = await db.query.routines.findFirst({
      where: eq(schema.routines.id, id),
    });

    if (!routine) {
      return Response.json({ error: "Routine not found" }, { status: 404 });
    }

    if (routine.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    const trimmedName = name?.trim();
    if (name !== undefined && !trimmedName) {
      return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    await db
      .update(schema.routines)
      .set({
        ...(trimmedName !== undefined && { name: trimmedName }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(schema.routines.id, id));

    const updated = await db.query.routines.findFirst({
      where: eq(schema.routines.id, id),
    });

    const routineDays = await getRoutineDaysWithWeekdays(id);

    return Response.json({
      ...updated,
      routineDays,
    });
  } catch (error) {
    console.error("Update routine error:", error);
    return Response.json(
      { error: "Failed to update routine" },
      { status: 500 },
    );
  }
}

// DELETE /api/routines/[id] - Delete routine (cascades)
export async function DELETE(request: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const routine = await db.query.routines.findFirst({
      where: eq(schema.routines.id, id),
    });

    if (!routine) {
      return Response.json({ error: "Routine not found" }, { status: 404 });
    }

    if (routine.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete routine (cascades to routine days, set groups, sets via FK)
    await db.delete(schema.routines).where(eq(schema.routines.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete routine error:", error);
    return Response.json(
      { error: "Failed to delete routine" },
      { status: 500 },
    );
  }
}
