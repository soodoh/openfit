// Type definitions for the application
// Re-exports Drizzle schema types and defines API response shapes
import type { Exercise as DbExercise } from "@/db/schema/exercises";
import type { Routine, RoutineDay as DbRoutineDay } from "@/db/schema/routines";
import type { Gym as DbGym, UserProfile } from "@/db/schema/user-data";
import type { WorkoutSession } from "@/db/schema/workouts";
// Re-export base types from DB schema
export type { UserProfile, Routine, WorkoutSession };
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
export type RepetitionUnit = {
    id: string;
    name: string;
    createdAt?: Date;
};
export type WeightUnit = {
    id: string;
    name: string;
    createdAt?: Date;
};
export type Equipment = {
    id: string;
    name: string;
    createdAt?: Date;
};
export type MuscleGroup = {
    id: string;
    name: string;
    createdAt?: Date;
};
export type Category = {
    id: string;
    name: string;
    createdAt?: Date;
};
// Workout set group/set — defined to match API response shape (no createdAt/updatedAt)
export type WorkoutSetGroup = {
    id: string;
    userId: string;
    routineDayId: string | undefined;
    sessionId: string | undefined;
    type: SetGroupType | string;
    order: number;
    comment: string | undefined;
};
export type WorkoutSet = {
    id: string;
    userId: string;
    setGroupId: string;
    exerciseId: string;
    type: SetType | string;
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
    imageUrl?: string | undefined;
    primaryMuscleIds?: string[];
    secondaryMuscleIds?: string[];
    instructions?: string[];
    imageUrls?: Array<string | undefined>;
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
    imageUrl: string | undefined;
} & Exercise;
// Complex types with relations
export type RoutineWithDays = {
    routineDays: RoutineDay[];
} & Routine;
export type RoutineDayWithRoutine = {
    routine: {
        id: string;
        name: string;
    } | undefined;
} & RoutineDay;
export type WorkoutSetWithRelations = {
    exercise: {
        id: string;
        name: string;
        imageUrl: string | undefined;
    } | undefined;
    repetitionUnit: {
        id: string;
        name: string;
    } | undefined;
    weightUnit: {
        id: string;
        name: string;
    } | undefined;
} & WorkoutSet;
export type WorkoutSetGroupWithSets = {
    sets: WorkoutSetWithRelations[];
} & WorkoutSetGroup;
export type RoutineDayWithData = {
    routine: {
        id: string;
        name: string;
    } | undefined;
    setGroups: WorkoutSetGroupWithSets[];
} & RoutineDay;
export type WorkoutSessionWithData = {
    setGroups: WorkoutSetGroupWithSets[];
} & WorkoutSession;
// Minimal session data for calendar cards
export type WorkoutSessionSummary = Pick<WorkoutSession, "id" | "createdAt" | "name" | "startTime" | "endTime" | "impression">;
export type Units = {
    repetitionUnits: RepetitionUnit[];
    weightUnits: WeightUnit[];
};
// Backwards-compat aliases
export type GymWithEquipment = Gym;
export type RoutineDayWithWeekdays = RoutineDay;
export type SetWithRelations = WorkoutSetWithRelations;
export type SetGroupWithRelations = WorkoutSetGroupWithSets;
