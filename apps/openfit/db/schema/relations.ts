import { relations } from "drizzle-orm";
import { accounts, sessions, users } from "./auth";
import {
  exerciseImages,
  exerciseInstructions,
  exercisePrimaryMuscles,
  exercises,
  exerciseSecondaryMuscles,
} from "./exercises";
import {
  categories,
  equipment,
  muscleGroups,
  repetitionUnits,
  weightUnits,
} from "./reference";
import { routineDays, routineDayWeekdays, routines } from "./routines";
import { gymEquipment, gyms, userProfiles } from "./user-data";
import { workoutSessions, workoutSetGroups, workoutSets } from "./workouts";

// Auth relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  sessions: many(sessions),
  accounts: many(accounts),
  gyms: many(gyms),
  routines: many(routines),
  routineDays: many(routineDays),
  workoutSessions: many(workoutSessions),
  workoutSetGroups: many(workoutSetGroups),
  workoutSets: many(workoutSets),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// User data relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
  defaultRepetitionUnit: one(repetitionUnits, {
    fields: [userProfiles.defaultRepetitionUnitId],
    references: [repetitionUnits.id],
  }),
  defaultWeightUnit: one(weightUnits, {
    fields: [userProfiles.defaultWeightUnitId],
    references: [weightUnits.id],
  }),
  defaultGym: one(gyms, {
    fields: [userProfiles.defaultGymId],
    references: [gyms.id],
  }),
}));

export const gymsRelations = relations(gyms, ({ one, many }) => ({
  user: one(users, {
    fields: [gyms.userId],
    references: [users.id],
  }),
  equipment: many(gymEquipment),
}));

export const gymEquipmentRelations = relations(gymEquipment, ({ one }) => ({
  gym: one(gyms, {
    fields: [gymEquipment.gymId],
    references: [gyms.id],
  }),
  equipment: one(equipment, {
    fields: [gymEquipment.equipmentId],
    references: [equipment.id],
  }),
}));

// Reference data relations
export const equipmentRelations = relations(equipment, ({ many }) => ({
  exercises: many(exercises),
  gymEquipment: many(gymEquipment),
}));

export const muscleGroupsRelations = relations(muscleGroups, ({ many }) => ({
  primaryExercises: many(exercisePrimaryMuscles),
  secondaryExercises: many(exerciseSecondaryMuscles),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  exercises: many(exercises),
}));

export const repetitionUnitsRelations = relations(
  repetitionUnits,
  ({ many }) => ({
    userProfiles: many(userProfiles),
    workoutSets: many(workoutSets),
  }),
);

export const weightUnitsRelations = relations(weightUnits, ({ many }) => ({
  userProfiles: many(userProfiles),
  workoutSets: many(workoutSets),
}));

// Exercise relations
export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [exercises.equipmentId],
    references: [equipment.id],
  }),
  category: one(categories, {
    fields: [exercises.categoryId],
    references: [categories.id],
  }),
  primaryMuscles: many(exercisePrimaryMuscles),
  secondaryMuscles: many(exerciseSecondaryMuscles),
  instructions: many(exerciseInstructions),
  images: many(exerciseImages),
  workoutSets: many(workoutSets),
}));

export const exercisePrimaryMusclesRelations = relations(
  exercisePrimaryMuscles,
  ({ one }) => ({
    exercise: one(exercises, {
      fields: [exercisePrimaryMuscles.exerciseId],
      references: [exercises.id],
    }),
    muscleGroup: one(muscleGroups, {
      fields: [exercisePrimaryMuscles.muscleGroupId],
      references: [muscleGroups.id],
    }),
  }),
);

export const exerciseSecondaryMusclesRelations = relations(
  exerciseSecondaryMuscles,
  ({ one }) => ({
    exercise: one(exercises, {
      fields: [exerciseSecondaryMuscles.exerciseId],
      references: [exercises.id],
    }),
    muscleGroup: one(muscleGroups, {
      fields: [exerciseSecondaryMuscles.muscleGroupId],
      references: [muscleGroups.id],
    }),
  }),
);

export const exerciseInstructionsRelations = relations(
  exerciseInstructions,
  ({ one }) => ({
    exercise: one(exercises, {
      fields: [exerciseInstructions.exerciseId],
      references: [exercises.id],
    }),
  }),
);

export const exerciseImagesRelations = relations(exerciseImages, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exerciseImages.exerciseId],
    references: [exercises.id],
  }),
}));

// Routine relations
export const routinesRelations = relations(routines, ({ one, many }) => ({
  user: one(users, {
    fields: [routines.userId],
    references: [users.id],
  }),
  days: many(routineDays),
}));

export const routineDaysRelations = relations(routineDays, ({ one, many }) => ({
  routine: one(routines, {
    fields: [routineDays.routineId],
    references: [routines.id],
  }),
  user: one(users, {
    fields: [routineDays.userId],
    references: [users.id],
  }),
  weekdays: many(routineDayWeekdays),
  setGroups: many(workoutSetGroups),
  workoutSessions: many(workoutSessions),
}));

export const routineDayWeekdaysRelations = relations(
  routineDayWeekdays,
  ({ one }) => ({
    routineDay: one(routineDays, {
      fields: [routineDayWeekdays.routineDayId],
      references: [routineDays.id],
    }),
  }),
);

// Workout relations
export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workoutSessions.userId],
      references: [users.id],
    }),
    template: one(routineDays, {
      fields: [workoutSessions.templateId],
      references: [routineDays.id],
    }),
    setGroups: many(workoutSetGroups),
  }),
);

export const workoutSetGroupsRelations = relations(
  workoutSetGroups,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workoutSetGroups.userId],
      references: [users.id],
    }),
    routineDay: one(routineDays, {
      fields: [workoutSetGroups.routineDayId],
      references: [routineDays.id],
    }),
    session: one(workoutSessions, {
      fields: [workoutSetGroups.sessionId],
      references: [workoutSessions.id],
    }),
    sets: many(workoutSets),
  }),
);

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  user: one(users, {
    fields: [workoutSets.userId],
    references: [users.id],
  }),
  setGroup: one(workoutSetGroups, {
    fields: [workoutSets.setGroupId],
    references: [workoutSetGroups.id],
  }),
  exercise: one(exercises, {
    fields: [workoutSets.exerciseId],
    references: [exercises.id],
  }),
  repetitionUnit: one(repetitionUnits, {
    fields: [workoutSets.repetitionUnitId],
    references: [repetitionUnits.id],
  }),
  weightUnit: one(weightUnits, {
    fields: [workoutSets.weightUnitId],
    references: [weightUnits.id],
  }),
}));
