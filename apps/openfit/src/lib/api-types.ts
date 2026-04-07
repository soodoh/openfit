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
	description: string | null | undefined;
	createdAt: Date | string;
	updatedAt: Date | string;
	routineDays: RoutineDayDto[];
};

export type RoutineRelationDto = {
	id: string;
	userId: string;
	name: string;
	description: string | null | undefined;
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
	exercise:
		| {
				id: string;
				name: string;
				imageUrl: string | null | undefined;
		  }
		| null
		| undefined;
	repetitionUnit: LookupItemDto | null | undefined;
	weightUnit: LookupItemDto | null | undefined;
};

export type RoutineDaySetGroupDto = {
	id: string;
	userId: string;
	routineDayId: string | null | undefined;
	sessionId: string | null | undefined;
	type: string;
	order: number;
	comment: string | null | undefined;
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
	routine: RoutineRelationDto | null | undefined;
	setGroups?: RoutineDaySetGroupDto[];
};
