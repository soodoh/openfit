// Type definitions for the application
// Re-exports Drizzle schema types and defines API response shapes
import type {
	Exercise as DbExercise,
	ExerciseForce,
	ExerciseLevel,
	ExerciseMechanic,
} from "@/db/schema/exercises";
import type { RoutineDay as DbRoutineDay, Routine } from "@/db/schema/routines";
import type {
	Gym as DbGym,
	UserProfile as DbUserProfile,
	Role,
	Theme,
} from "@/db/schema/user-data";
import type { WorkoutSession as DbWorkoutSession } from "@/db/schema/workouts";

// Re-export base types from DB schema
export type {
	DbUserProfile as UserProfile,
	DbWorkoutSession as WorkoutSession,
	Routine,
};
// Re-export enum values with expected names
export const SetType = {
	NORMAL: "NORMAL",
	WARMUP: "WARMUP",
	DROPSET: "DROPSET",
	FAILURE: "FAILURE",
} as const;
type _SetType = (typeof SetType)[keyof typeof SetType];
export type SetType = _SetType;
export const SetGroupType = {
	NORMAL: "NORMAL",
	SUPERSET: "SUPERSET",
} as const;
type _SetGroupType = (typeof SetGroupType)[keyof typeof SetGroupType];
export type SetGroupType = _SetGroupType;
// Reference types — optional createdAt since API responses may omit it
export type LookupItem = {
	id: string;
	name: string;
};
export type RepetitionUnit = LookupItem & {
	createdAt?: Date;
};
export type WeightUnit = LookupItem & {
	createdAt?: Date;
};
export type Equipment = LookupItem & {
	createdAt?: Date;
};
export type MuscleGroup = LookupItem & {
	createdAt?: Date;
};
export type Category = LookupItem & {
	createdAt?: Date;
};
export type PaginatedResponse<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
};
export type AdminPaginationParams = {
	page: number;
	pageSize: number;
	search?: string;
};
// Workout set group/set — defined to match API response shape (no createdAt/updatedAt)
export type WorkoutSetGroup = {
	id: string;
	userId: string;
	routineDayId: string | null | undefined;
	sessionId: string | null | undefined;
	type: string;
	order: number;
	comment: string | null | undefined;
};
export type WorkoutSet = {
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
};
// Extended types for API response shapes (computed fields from junction tables)
export type Exercise = {
	imageUrl?: string | null | undefined;
	primaryMuscleIds?: string[];
	secondaryMuscleIds?: string[];
	instructions?: string[];
	imageUrls?: Array<string | null | undefined>;
} & DbExercise;
export type RoutineDay = {
	weekdays: number[];
} & DbRoutineDay;
export type Gym = {
	equipmentIds: string[];
} & DbGym;
// View mode constant (UI-only, not in DB)
export const ListView = {
	EditTemplate: "EditTemplate",
	CurrentSession: "CurrentSession",
	ViewSession: "ViewSession",
} as const;
export type ListView = (typeof ListView)[keyof typeof ListView];
// ID type aliases (just strings, preserves readability)
export type ExerciseId = string;
export type RoutineId = string;
export type RoutineDayId = string;
export type WorkoutSessionId = string;
export type WorkoutSetGroupId = string;
export type WorkoutSetId = string;
export type RepetitionUnitId = string;
export type WeightUnitId = string;
export type EquipmentId = string;
export type MuscleGroupId = string;
export type CategoryId = string;
export type GymId = string;
// Exercise with first image URL (for list views)
export type ExerciseWithImageUrl = {
	imageUrl: string | null | undefined;
} & Exercise;
// Complex types with relations
export type RoutineWithDays = {
	routineDays: RoutineDay[];
} & Routine;
export type RoutineDayWithRoutine = {
	routine:
		| {
				id: string;
				name: string;
		  }
		| null
		| undefined;
} & RoutineDay;
export type WorkoutSetWithRelations = {
	exercise:
		| {
				id: string;
				name: string;
				imageUrl: string | null | undefined;
		  }
		| null
		| undefined;
	repetitionUnit:
		| {
				id: string;
				name: string;
		  }
		| null
		| undefined;
	weightUnit:
		| {
				id: string;
				name: string;
		  }
		| null
		| undefined;
} & WorkoutSet;
export type WorkoutSetGroupWithSets = {
	sets: WorkoutSetWithRelations[];
} & WorkoutSetGroup;
export type RoutineDayWithData = {
	routine:
		| {
				id: string;
				name: string;
		  }
		| null
		| undefined;
	setGroups: WorkoutSetGroupWithSets[];
} & RoutineDay;
export type WorkoutSessionWithData = {
	setGroups: WorkoutSetGroupWithSets[];
	startTime: Date | string;
	endTime: Date | string | null | undefined;
	impression: number | null | undefined;
	notes: string | null | undefined;
	templateId: string | null | undefined;
} & Omit<
	DbWorkoutSession,
	"startTime" | "endTime" | "impression" | "notes" | "templateId"
>;
// Minimal session data for calendar cards
export type WorkoutSessionSummary = {
	id: string;
	createdAt: Date | string;
	name: string;
	startTime: Date | string;
	endTime: Date | string | null | undefined;
	impression: number | null | undefined;
};
export type Units = {
	repetitionUnits: RepetitionUnit[];
	weightUnits: WeightUnit[];
};
export type DashboardStats = {
	totalSessions: number;
	totalRoutines: number;
	thisWeekSessions: number;
	currentStreak: number;
};
export type DashboardRecentSession = {
	id: string;
	name: string;
	startTime: Date | string;
	endTime: Date | string | null | undefined;
	impression: number | null | undefined;
	setGroups: Array<{
		id: string;
		type: string;
		order: number;
		sets: Array<{
			id: string;
			exerciseId: string;
			exercise:
				| {
						id: string;
						name: string;
						imageUrl: string | null | undefined;
				  }
				| null
				| undefined;
		}>;
	}>;
};
export type UserProfileWithDefaults = Omit<
	DbUserProfile,
	| "role"
	| "theme"
	| "defaultRepetitionUnitId"
	| "defaultWeightUnitId"
	| "defaultGymId"
> & {
	role: Role;
	theme: Theme;
	defaultRepetitionUnitId: string | null | undefined;
	defaultWeightUnitId: string | null | undefined;
	defaultGymId: string | null | undefined;
	defaultRepetitionUnit: LookupItem | null | undefined;
	defaultWeightUnit: LookupItem | null | undefined;
	defaultGym: LookupItem | null | undefined;
};
export type AdminUserWithProfile = {
	id: string;
	userId: string;
	email: string;
	role: Role;
};
export type AdminExerciseWithRelations = {
	id: string;
	name: string;
	level: ExerciseLevel;
	force?: ExerciseForce | null | undefined;
	mechanic?: ExerciseMechanic | null | undefined;
	equipmentId?: string | null | undefined;
	categoryId: string;
	primaryMuscleIds: string[];
	secondaryMuscleIds: string[];
	instructions: string[];
	imageUrls: Array<string | null | undefined>;
	equipment: LookupItem | null | undefined;
	category: LookupItem | null | undefined;
	primaryMuscles: LookupItem[];
	secondaryMuscles: LookupItem[];
};
// Backwards-compat aliases
export type GymWithEquipment = Gym;
export type RoutineDayWithWeekdays = RoutineDay;
export type SetWithRelations = WorkoutSetWithRelations;
export type SetGroupWithRelations = WorkoutSetGroupWithSets;
