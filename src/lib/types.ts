/* eslint-disable eslint-plugin-import(no-duplicates), typescript-eslint(array-type), typescript-eslint(no-restricted-types) */
// Type definitions for the application
// Re-exports Drizzle schema types and defines API response shapes

import { SetGroupTypeEnum, SetTypeEnum } from '@/db/schema';
import type { SetGroupType as _SetGroupType, SetType as _SetType } from '@/db/schema';
import type {
  Exercise as DbExercise,
  Gym as DbGym,
  RoutineDay as DbRoutineDay,
  Routine,
  UserProfile,
  WorkoutSession,
} from "@/db/schema";

// Re-export base types from DB schema
export type { UserProfile, Routine, WorkoutSession };

// Re-export enum values with expected names
export const SetType = SetTypeEnum;
export type SetType = _SetType;

export const SetGroupType = SetGroupTypeEnum;
export type SetGroupType = _SetGroupType;

// Reference types — optional createdAt since API responses may omit it
export type RepetitionUnit = {
  id: string;
  name: string;
  createdAt?: Date;
}

export type WeightUnit = {
  id: string;
  name: string;
  createdAt?: Date;
}

export type Equipment = {
  id: string;
  name: string;
  createdAt?: Date;
}

export type MuscleGroup = {
  id: string;
  name: string;
  createdAt?: Date;
}

export type Category = {
  id: string;
  name: string;
  createdAt?: Date;
}

// Workout set group/set — defined to match API response shape (no createdAt/updatedAt)
export type WorkoutSetGroup = {
  id: string;
  userId: string;
  routineDayId: string | null;
  sessionId: string | null;
  type: SetGroupType | string;
  order: number;
  comment: string | null;
}

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
}

// Extended types for API response shapes (computed fields from junction tables)
export type Exercise = {
  imageUrl?: string | null;
  primaryMuscleIds?: string[];
  secondaryMuscleIds?: string[];
  instructions?: string[];
  imageUrls?: (string | null)[];
} & DbExercise

export type RoutineDay = {
  weekdays: number[];
} & DbRoutineDay

export type Gym = {
  equipmentIds: string[];
} & DbGym

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
  imageUrl: string | null;
} & Exercise

// Complex types with relations
export type RoutineWithDays = {
  routineDays: RoutineDay[];
} & Routine

export type RoutineDayWithRoutine = {
  routine: { id: string; name: string } | null;
} & RoutineDay

export type WorkoutSetWithRelations = {
  exercise: {
    id: string;
    name: string;
    imageUrl: string | null;
  } | null;
  repetitionUnit: { id: string; name: string } | null;
  weightUnit: { id: string; name: string } | null;
} & WorkoutSet

export type WorkoutSetGroupWithSets = {
  sets: WorkoutSetWithRelations[];
} & WorkoutSetGroup

export type RoutineDayWithData = {
  routine: { id: string; name: string } | null;
  setGroups: WorkoutSetGroupWithSets[];
} & RoutineDay

export type WorkoutSessionWithData = {
  setGroups: WorkoutSetGroupWithSets[];
} & WorkoutSession

// Minimal session data for calendar cards
export type WorkoutSessionSummary = Pick<
  WorkoutSession,
  "id" | "createdAt" | "name" | "startTime" | "endTime" | "impression"
>;

export type Units = {
  repetitionUnits: RepetitionUnit[];
  weightUnits: WeightUnit[];
}

// Backwards-compat aliases
export type GymWithEquipment = Gym;
export type RoutineDayWithWeekdays = RoutineDay;
export type SetWithRelations = WorkoutSetWithRelations;
export type SetGroupWithRelations = WorkoutSetGroupWithSets;
