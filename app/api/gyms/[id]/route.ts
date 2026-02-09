import { db } from "@/db";
import * as schema from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/gyms/[id] - Get single gym
export async function GET(request: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireAuth(request);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const gym = await db.query.gyms.findFirst({
    where: eq(schema.gyms.id, id),
    with: {
      equipment: {
        with: {
          equipment: true,
        },
      },
    },
  });

  if (!gym) {
    return Response.json({ error: "Gym not found" }, { status: 404 });
  }

  if (gym.userId !== session.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  return Response.json({
    ...gym,
    equipmentIds: gym.equipment.map((ge) => ge.equipmentId),
  });
}

// PATCH /api/gyms/[id] - Update gym
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
    const gym = await db.query.gyms.findFirst({
      where: eq(schema.gyms.id, id),
    });

    if (!gym) {
      return Response.json({ error: "Gym not found" }, { status: 404 });
    }

    if (gym.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, equipmentIds } = body;

    const trimmedName = name?.trim();
    if (name !== undefined && !trimmedName) {
      return Response.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    // Update gym
    await db
      .update(schema.gyms)
      .set({
        ...(trimmedName !== undefined && { name: trimmedName }),
        updatedAt: new Date(),
      })
      .where(eq(schema.gyms.id, id));

    // Update equipment if provided
    if (equipmentIds !== undefined) {
      // Delete existing equipment
      await db
        .delete(schema.gymEquipment)
        .where(eq(schema.gymEquipment.gymId, id));

      // Add new equipment
      for (const equipmentId of equipmentIds) {
        await db.insert(schema.gymEquipment).values({
          id: nanoid(),
          gymId: id,
          equipmentId,
        });
      }
    }

    const updated = await db.query.gyms.findFirst({
      where: eq(schema.gyms.id, id),
      with: {
        equipment: {
          with: {
            equipment: true,
          },
        },
      },
    });

    return Response.json({
      ...updated,
      equipmentIds: updated?.equipment.map((ge) => ge.equipmentId) || [],
    });
  } catch (error) {
    console.error("Update gym error:", error);
    return Response.json({ error: "Failed to update gym" }, { status: 500 });
  }
}

// DELETE /api/gyms/[id] - Delete gym
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
    const gym = await db.query.gyms.findFirst({
      where: eq(schema.gyms.id, id),
    });

    if (!gym) {
      return Response.json({ error: "Gym not found" }, { status: 404 });
    }

    if (gym.userId !== session.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete gym (cascades to equipment via FK)
    await db.delete(schema.gyms).where(eq(schema.gyms.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete gym error:", error);
    return Response.json({ error: "Failed to delete gym" }, { status: 500 });
  }
}
