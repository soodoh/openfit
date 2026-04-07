export type MutationSuccessResult = { success: true };
export type MutationIdResult = { id: string };

export type LookupItemDto = {
	id: string;
	name: string;
};

export type CursorPage<T> = {
	page: T[];
	isDone: boolean;
	continueCursor: string | null;
};

export type AdminPage<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
};

export type RoutineDto = {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	routineDays: RoutineDayDto[];
};

export type RoutineRelationDto = {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
};

export type WorkoutSetDto = {
	id: string;
	userId: string;
	setGroupId: string;
	exerciseId: string;
	type: string;
	order: number;
	reps: number;
	repetitionUnitId: string;
	weight: number;
	weightUnitId: string;
	restTime: number;
	completed: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	exercise: {
		id: string;
		name: string;
		imageUrl?: string | null;
	} | null;
	repetitionUnit: LookupItemDto | null;
	weightUnit: LookupItemDto | null;
};

export type RoutineDaySetGroupDto = {
	id: string;
	userId: string;
	routineDayId: string | null;
	sessionId: string | null;
	type: string;
	order: number;
	comment: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	sets: WorkoutSetDto[];
};

export type RoutineDayDto = {
	id: string;
	routineId: string;
	userId: string;
	description: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	weekdays: number[];
	routine?: RoutineRelationDto | null;
	setGroups?: RoutineDaySetGroupDto[];
};
