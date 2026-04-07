import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";

export async function loadRoutineById(id: string) {
	return db.query.routines.findFirst({
		where: eq(schema.routines.id, id),
	});
}

export async function requireOwnedRoutine(userId: string, id: string) {
	const routine = await loadRoutineById(id);
	if (!routine) {
		return { status: 404 as const, error: "Routine not found" };
	}
	if (routine.userId !== userId) {
		return { status: 403 as const, error: "Unauthorized" };
	}
	return { status: 200 as const, routine };
}

export async function loadRoutineDayWithRelations(id: string) {
	return db.query.routineDays.findFirst({
		where: eq(schema.routineDays.id, id),
		with: {
			routine: true,
			weekdays: true,
		},
	});
}

export async function requireOwnedRoutineDay(userId: string, id: string) {
	const routineDay = await loadRoutineDayWithRelations(id);
	if (!routineDay) {
		return { status: 404 as const, error: "Routine day not found" };
	}
	if (routineDay.userId !== userId) {
		return { status: 403 as const, error: "Unauthorized" };
	}
	return { status: 200 as const, routineDay };
}

export async function loadGymWithEquipment(id: string) {
	return db.query.gyms.findFirst({
		where: eq(schema.gyms.id, id),
		with: {
			equipment: {
				with: {
					equipment: true,
				},
			},
		},
	});
}

export async function requireOwnedGym(userId: string, id: string) {
	const gym = await loadGymWithEquipment(id);
	if (!gym) {
		return { status: 404 as const, error: "Gym not found" };
	}
	if (gym.userId !== userId) {
		return { status: 403 as const, error: "Unauthorized" };
	}
	return { status: 200 as const, gym };
}
