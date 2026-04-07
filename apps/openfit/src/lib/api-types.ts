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
	createdAt: string;
	updatedAt: string;
	routineDays: RoutineDayDto[];
};

export type RoutineQueryDto = Omit<
	RoutineDto,
	"createdAt" | "updatedAt" | "routineDays"
> & {
	createdAt: string;
	updatedAt: string;
	routineDays: Array<
		Omit<RoutineDayDto, "createdAt" | "updatedAt"> & {
			createdAt: string;
			updatedAt: string;
		}
	>;
};

export type RoutineRelationDto = {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
};

export type RoutineRelationResult = Omit<
	RoutineRelationDto,
	"createdAt" | "updatedAt"
> & {
	createdAt: Date;
	updatedAt: Date;
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
	createdAt: string;
	updatedAt: string;
	exercise: {
		id: string;
		name: string;
		imageUrl?: string | null;
	} | null;
	repetitionUnit: LookupItemDto | null;
	weightUnit: LookupItemDto | null;
};

export type WorkoutSetResult = Omit<
	WorkoutSetDto,
	"createdAt" | "updatedAt" | "exercise"
> & {
	createdAt: Date;
	updatedAt: Date;
	exercise:
		| {
				id: string;
				name: string;
				imageUrl: string | null | undefined;
		  }
		| null
		| undefined;
};

export type RoutineDaySetGroupDto = {
	id: string;
	userId: string;
	routineDayId: string | null;
	sessionId: string | null;
	type: string;
	order: number;
	comment: string | null;
	createdAt: string;
	updatedAt: string;
	sets: WorkoutSetDto[];
};

export type RoutineDaySetGroupResult = Omit<
	RoutineDaySetGroupDto,
	"createdAt" | "updatedAt" | "sets"
> & {
	createdAt: Date;
	updatedAt: Date;
	sets: WorkoutSetResult[];
};

export type RoutineDayDetailSetGroupDto = Omit<
	RoutineDaySetGroupDto,
	"sets"
> & {
	sets: Array<
		Omit<RoutineDaySetGroupDto["sets"][number], "exercise"> & {
			exercise:
				| {
						id: string;
						name: string;
						imageUrl: string | null | undefined;
				  }
				| null
				| undefined;
		}
	>;
};

export type RoutineDayDto = {
	id: string;
	routineId: string;
	userId: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	weekdays: number[];
	routine?: RoutineRelationDto | null;
	setGroups?: RoutineDaySetGroupDto[];
};

export type RoutineDayResult = Omit<
	RoutineDayDto,
	"createdAt" | "updatedAt" | "routine" | "setGroups"
> & {
	createdAt: Date;
	updatedAt: Date;
	routine?: RoutineRelationResult | null;
	setGroups?: RoutineDaySetGroupResult[];
};

export type RoutineDaySearchDto = Omit<
	RoutineDayDto,
	"createdAt" | "updatedAt" | "routine"
> & {
	createdAt: string;
	updatedAt: string;
	routine: RoutineRelationDto | null | undefined;
};

export type RoutineDaySearchResult = Omit<
	RoutineDaySearchDto,
	"createdAt" | "updatedAt" | "routine"
> & {
	createdAt: Date;
	updatedAt: Date;
	routine: RoutineRelationResult | null | undefined;
};

export type RoutineDayDetailDto = Omit<RoutineDaySearchDto, "setGroups"> & {
	setGroups: RoutineDayDetailSetGroupDto[];
};

export type RoutineDayDetailResult = Omit<
	RoutineDayDetailDto,
	"createdAt" | "updatedAt" | "routine" | "setGroups"
> & {
	createdAt: Date;
	updatedAt: Date;
	routine: RoutineRelationResult | null | undefined;
	setGroups: RoutineDaySetGroupResult[];
};

export type RoutineResult = Omit<
	RoutineDto,
	"createdAt" | "updatedAt" | "routineDays"
> & {
	createdAt: Date;
	updatedAt: Date;
	routineDays: RoutineDayResult[];
};

export type RoutineQueryResult = Omit<
	RoutineQueryDto,
	"createdAt" | "updatedAt" | "routineDays"
> & {
	createdAt: Date;
	updatedAt: Date;
	routineDays: RoutineDayResult[];
};
