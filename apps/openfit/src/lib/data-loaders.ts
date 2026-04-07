import { asc, eq, inArray } from "drizzle-orm";
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

export async function getFirstExerciseImageUrls(
	exerciseIds: string[],
): Promise<Map<string, string>> {
	const uniqueExerciseIds = Array.from(new Set(exerciseIds));
	if (uniqueExerciseIds.length === 0) {
		return new Map();
	}

	const images = await db.query.exerciseImages.findMany({
		where: inArray(schema.exerciseImages.exerciseId, uniqueExerciseIds),
		orderBy: asc(schema.exerciseImages.order),
	});
	const firstImageUrls = new Map<string, string>();

	for (const image of images) {
		if (!firstImageUrls.has(image.exerciseId)) {
			firstImageUrls.set(image.exerciseId, image.path);
		}
	}

	return firstImageUrls;
}

export async function withFirstExerciseImageUrls<
	T extends {
		id: string;
	},
>(items: T[]): Promise<Array<T & { imageUrl: string | undefined }>> {
	const imageUrls = await getFirstExerciseImageUrls(
		items.map((item) => item.id),
	);

	return items.map((item) => ({
		...item,
		imageUrl: imageUrls.get(item.id),
	}));
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

async function hydrateSessionsWithData<
	T extends {
		id: string;
	},
>(sessions: T[]) {
	const uniqueSessionIds = Array.from(
		new Set(sessions.map((session) => session.id)),
	);
	if (uniqueSessionIds.length === 0) {
		return [];
	}

	const setGroups = await db.query.workoutSetGroups.findMany({
		where: inArray(schema.workoutSetGroups.sessionId, uniqueSessionIds),
		orderBy: asc(schema.workoutSetGroups.order),
	});
	const setGroupIds = setGroups.map((group) => group.id);
	const sets =
		setGroupIds.length > 0
			? await db.query.workoutSets.findMany({
					where: inArray(schema.workoutSets.setGroupId, setGroupIds),
					orderBy: asc(schema.workoutSets.order),
					with: {
						exercise: true,
						repetitionUnit: true,
						weightUnit: true,
					},
				})
			: [];
	const exerciseImageUrls = await getFirstExerciseImageUrls(
		sets.flatMap((set) => (set.exercise ? [set.exercise.id] : [])),
	);
	const setsByGroupId = new Map<string, typeof sets>();

	for (const set of sets) {
		const existingSets = setsByGroupId.get(set.setGroupId) ?? [];
		existingSets.push(
			Object.assign(set, {
				exercise: set.exercise
					? {
							...set.exercise,
							imageUrl: exerciseImageUrls.get(set.exercise.id) ?? null,
						}
					: null,
			}),
		);
		setsByGroupId.set(set.setGroupId, existingSets);
	}

	const setGroupsBySessionId = new Map<
		string,
		Array<(typeof setGroups)[number]>
	>();

	for (const group of setGroups) {
		const existingGroups =
			setGroupsBySessionId.get(group.sessionId ?? "") ?? [];
		existingGroups.push(
			Object.assign(group, {
				sets: setsByGroupId.get(group.id) ?? [],
			}),
		);
		if (group.sessionId) {
			setGroupsBySessionId.set(group.sessionId, existingGroups);
		}
	}

	return sessions.map((session) => ({
		...session,
		setGroups: setGroupsBySessionId.get(session.id) ?? [],
	}));
}

export async function getSessionsWithData(sessionIds: string[]) {
	const uniqueSessionIds = Array.from(new Set(sessionIds));
	if (uniqueSessionIds.length === 0) {
		return [];
	}

	const sessions = await db.query.workoutSessions.findMany({
		where: inArray(schema.workoutSessions.id, uniqueSessionIds),
	});
	const hydratedSessions = await hydrateSessionsWithData(sessions);
	const sessionsById = new Map(
		hydratedSessions.map((session) => [session.id, session]),
	);

	return sessionIds.map((sessionId) => sessionsById.get(sessionId) ?? null);
}

export async function getSessionWithData(sessionId: string) {
	const session = await db.query.workoutSessions.findFirst({
		where: eq(schema.workoutSessions.id, sessionId),
	});
	if (!session) {
		return null;
	}

	const [sessionWithData] = await hydrateSessionsWithData([session]);
	return sessionWithData ?? null;
}
