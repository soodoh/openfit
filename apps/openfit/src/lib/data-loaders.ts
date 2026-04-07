import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { schema } from "@/db/schema";

export async function getFirstExerciseImageUrl(
	exerciseId: string,
): Promise<string | undefined> {
	const image = await db.query.exerciseImages.findFirst({
		where: eq(schema.exerciseImages.exerciseId, exerciseId),
		orderBy: asc(schema.exerciseImages.order),
	});
	return image?.path ?? undefined;
}

export async function withFirstExerciseImageUrls<
	T extends {
		id: string;
	},
>(items: T[]): Promise<Array<T & { imageUrl: string | undefined }>> {
	return Promise.all(
		items.map(async (item) => ({
			...item,
			imageUrl: await getFirstExerciseImageUrl(item.id),
		})),
	);
}

export async function getRoutineDaysWithWeekdays(routineId: string) {
	const days = await db.query.routineDays.findMany({
		where: eq(schema.routineDays.routineId, routineId),
		with: {
			weekdays: true,
		},
	});
	return days.map((day) =>
		Object.assign(day, {
			weekdays: day.weekdays.map((w) => w.weekday),
		}),
	);
}

export async function getSessionWithData(sessionId: string) {
	const session = await db.query.workoutSessions.findFirst({
		where: eq(schema.workoutSessions.id, sessionId),
	});
	if (!session) {
		return null;
	}

	const setGroups = await db.query.workoutSetGroups.findMany({
		where: eq(schema.workoutSetGroups.sessionId, sessionId),
		orderBy: asc(schema.workoutSetGroups.order),
	});
	const setGroupsWithSets = await Promise.all(
		setGroups.map(async (group) => {
			const sets = await db.query.workoutSets.findMany({
				where: eq(schema.workoutSets.setGroupId, group.id),
				orderBy: asc(schema.workoutSets.order),
				with: {
					exercise: true,
					repetitionUnit: true,
					weightUnit: true,
				},
			});
			const setsWithImages = await Promise.all(
				sets.map(async (set) => {
					const imageUrl = set.exercise
						? await getFirstExerciseImageUrl(set.exercise.id)
						: null;
					return Object.assign(set, {
						exercise: set.exercise ? { ...set.exercise, imageUrl } : null,
					});
				}),
			);
			return Object.assign(group, {
				sets: setsWithImages,
			});
		}),
	);

	return {
		...session,
		setGroups: setGroupsWithSets,
	};
}
