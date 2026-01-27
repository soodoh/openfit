// Re-export Convex types for convenience
import { Doc, Id } from "@/convex/_generated/dataModel";

// Enums (matching schema)
export const SetType = {
  NORMAL: "NORMAL",
  WARMUP: "WARMUP",
  DROPSET: "DROPSET",
  FAILURE: "FAILURE",
} as const;
export type SetType = (typeof SetType)[keyof typeof SetType];

export const SetGroupType = {
  NORMAL: "NORMAL",
  SUPERSET: "SUPERSET",
} as const;
export type SetGroupType = (typeof SetGroupType)[keyof typeof SetGroupType];

// View mode constant (was in @/types/constants)
export const ListView = {
  EditTemplate: "EditTemplate",
  CurrentSession: "CurrentSession",
  ViewSession: "ViewSession",
} as const;
export type ListView = (typeof ListView)[keyof typeof ListView];

// Document types
export type UserProfile = Doc<"userProfiles">;
export type Exercise = Doc<"exercises">;
// Exercise with first image URL (for list views)
export type ExerciseWithImageUrl = Exercise & { imageUrl: string | null };
export type Routine = Doc<"routines">;
export type RoutineDay = Doc<"routineDays">;
export type WorkoutSession = Doc<"workoutSessions">;
export type WorkoutSetGroup = Doc<"workoutSetGroups">;
export type WorkoutSet = Doc<"workoutSets">;
export type RepetitionUnit = Doc<"repetitionUnits">;
export type WeightUnit = Doc<"weightUnits">;
export type Equipment = Doc<"equipment">;
export type MuscleGroup = Doc<"muscleGroups">;
export type Category = Doc<"categories">;
export type Gym = Doc<"gyms">;

// ID types
export type ExerciseId = Id<"exercises">;
export type RoutineId = Id<"routines">;
export type RoutineDayId = Id<"routineDays">;
export type WorkoutSessionId = Id<"workoutSessions">;
export type WorkoutSetGroupId = Id<"workoutSetGroups">;
export type WorkoutSetId = Id<"workoutSets">;
export type RepetitionUnitId = Id<"repetitionUnits">;
export type WeightUnitId = Id<"weightUnits">;
export type EquipmentId = Id<"equipment">;
export type MuscleGroupId = Id<"muscleGroups">;
export type CategoryId = Id<"categories">;
export type GymId = Id<"gyms">;

// Complex types with relations
export type RoutineWithDays = Routine & {
  routineDays: RoutineDay[];
};

export type RoutineDayWithRoutine = RoutineDay & {
  routine: Routine | null;
};

export type WorkoutSetWithRelations = WorkoutSet & {
  exercise: ExerciseWithImageUrl | null;
  repetitionUnit: RepetitionUnit | null;
  weightUnit: WeightUnit | null;
};

export type WorkoutSetGroupWithSets = WorkoutSetGroup & {
  sets: WorkoutSetWithRelations[];
};

export type RoutineDayWithData = RoutineDay & {
  routine: Routine | null;
  setGroups: WorkoutSetGroupWithSets[];
};

export type WorkoutSessionWithData = WorkoutSession & {
  setGroups: WorkoutSetGroupWithSets[];
};

// Minimal session data for calendar cards
export type WorkoutSessionSummary = Pick<
  WorkoutSession,
  "_id" | "_creationTime" | "name" | "startTime" | "endTime" | "impression"
>;

export type Units = {
  repetitionUnits: RepetitionUnit[];
  weightUnits: WeightUnit[];
};

// Aliases for backwards compatibility with old imports
export type SetWithRelations = WorkoutSetWithRelations;
export type SetGroupWithRelations = WorkoutSetGroupWithSets;
