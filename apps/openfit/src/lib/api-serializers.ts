import type { RoutineDayDto, RoutineDto } from "@/lib/api-types";

function serializeTimestamp(value: Date | string): string {
	return typeof value === "string" ? value : value.toISOString();
}

type SerializableRoutineRelation = Omit<
	NonNullable<RoutineDayDto["routine"]>,
	"createdAt" | "updatedAt"
> & {
	createdAt: Date | string;
	updatedAt: Date | string;
};

type SerializableRoutineDay = Omit<
	RoutineDayDto,
	"createdAt" | "updatedAt" | "weekdays" | "routine"
> & {
	createdAt: Date | string;
	updatedAt: Date | string;
	weekdays: Array<number | ({ weekday: number } & Record<string, unknown>)>;
	routine?: SerializableRoutineRelation | null;
};

type SerializableRoutine = Omit<
	RoutineDto,
	"createdAt" | "updatedAt" | "routineDays"
> & {
	createdAt: Date | string;
	updatedAt: Date | string;
	routineDays: SerializableRoutineDay[];
};

type SerializableGym = {
	id: string;
	userId: string;
	name: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	equipment: Array<{ equipmentId: string } & Record<string, unknown>>;
};

export function serializeRoutineDay(
	day: SerializableRoutineDay,
): RoutineDayDto {
	return {
		...day,
		createdAt: serializeTimestamp(day.createdAt),
		updatedAt: serializeTimestamp(day.updatedAt),
		routine: day.routine
			? {
					...day.routine,
					createdAt: serializeTimestamp(day.routine.createdAt),
					updatedAt: serializeTimestamp(day.routine.updatedAt),
				}
			: day.routine,
		weekdays: day.weekdays.map((entry) =>
			typeof entry === "number" ? entry : entry.weekday,
		),
	};
}

export function serializeRoutine(routine: SerializableRoutine): RoutineDto {
	return {
		...routine,
		createdAt: serializeTimestamp(routine.createdAt),
		updatedAt: serializeTimestamp(routine.updatedAt),
		routineDays: routine.routineDays.map(serializeRoutineDay),
	};
}

export function serializeGym(gym: SerializableGym) {
	return {
		...gym,
		createdAt: serializeTimestamp(gym.createdAt),
		updatedAt: serializeTimestamp(gym.updatedAt),
		equipmentIds: gym.equipment.map((entry) => entry.equipmentId),
	};
}
