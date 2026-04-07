import type {
	ExerciseForce,
	ExerciseLevel,
	ExerciseMechanic,
} from "@/db/schema/exercises";
import type { Role, Theme } from "@/db/schema/user-data";

export type MutationSuccessResult = { success: true };
export type MutationIdResult = { id: string };
export type SetDeleteResult = MutationSuccessResult & {
	setGroupDeleted: boolean;
};

export type LookupItemDto = {
	id: string;
	name: string;
};

export type GymDto = {
	id: string;
	userId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	equipmentIds: string[];
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

export type WorkoutSetResult = {
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
	repetitionUnit: LookupItemDto | null;
	weightUnit: LookupItemDto | null;
};

export type WorkoutSetMutationResult = {
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
	exercise: ExerciseResult | null;
	repetitionUnit: LookupResult | null;
	weightUnit: LookupResult | null;
};

export type SessionWorkoutSetResult = Omit<
	WorkoutSetMutationResult,
	"exercise"
> & {
	exercise: (ExerciseResult & { imageUrl: string | null }) | null;
};

export type WorkoutSetGroupDto = {
	id: string;
	userId: string;
	routineDayId: string | null;
	sessionId: string | null;
	type: string;
	order: number;
	comment: string | null;
	createdAt: string;
	updatedAt: string;
};

export type WorkoutSetGroupWithSetsDto = WorkoutSetGroupDto & {
	sets: WorkoutSetDto[];
};

export type WorkoutSetGroupResult = Omit<
	WorkoutSetGroupDto,
	"createdAt" | "updatedAt"
> & {
	createdAt: Date;
	updatedAt: Date;
};

export type WorkoutSetGroupMutationResult = {
	id: string;
	userId: string;
	routineDayId: string | null;
	sessionId: string | null;
	type: string;
	order: number;
	comment: string | null;
	createdAt: string;
	updatedAt: string;
};

export type WorkoutSetGroupWithSetsResult = WorkoutSetGroupResult & {
	sets: WorkoutSetResult[];
};

export type WorkoutSetGroupWithMutationSetsResult =
	WorkoutSetGroupMutationResult & {
		sets: WorkoutSetMutationResult[];
	};

export type SessionWorkoutSetGroupResult = WorkoutSetGroupMutationResult & {
	sets: SessionWorkoutSetResult[];
};

export type RoutineDaySetGroupDto = WorkoutSetGroupWithSetsDto;

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

export type LookupResult = LookupItemDto & {
	createdAt: string;
};

export type GymResult = {
	id: string;
	userId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

export type ExerciseResult = {
	id: string;
	name: string;
	equipmentId: string | null;
	force: ExerciseForce | null;
	level: ExerciseLevel;
	mechanic: ExerciseMechanic | null;
	categoryId: string;
	createdAt: string;
	updatedAt: string;
};

export type SessionResult = {
	id: string;
	userId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	startTime: string;
	endTime: string | null;
	impression: number | null;
	notes: string;
	templateId: string | null;
	setGroups: SessionWorkoutSetGroupResult[];
};

export type UserProfileBaseResult = {
	id: string;
	userId: string;
	role: Role;
	theme: Theme;
	defaultRepetitionUnitId: string | null;
	defaultWeightUnitId: string | null;
	defaultGymId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type UserProfileResult = UserProfileBaseResult & {
	defaultRepetitionUnit: LookupResult | null;
	defaultWeightUnit: LookupResult | null;
	defaultGym: GymResult | null;
};
