import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { categories, equipment, muscleGroups } from "./reference";

// Exercise enum types
export const ExerciseForceEnum = {
  push: "push",
  pull: "pull",
  static: "static",
} as const;
export type ExerciseForce =
  (typeof ExerciseForceEnum)[keyof typeof ExerciseForceEnum];

export const ExerciseLevelEnum = {
  beginner: "beginner",
  intermediate: "intermediate",
  expert: "expert",
} as const;
export type ExerciseLevel =
  (typeof ExerciseLevelEnum)[keyof typeof ExerciseLevelEnum];

export const ExerciseMechanicEnum = {
  compound: "compound",
  isolation: "isolation",
} as const;
export type ExerciseMechanic =
  (typeof ExerciseMechanicEnum)[keyof typeof ExerciseMechanicEnum];

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  equipmentId: text("equipment_id").references(() => equipment.id),
  force: text("force", { enum: ["push", "pull", "static"] }),
  level: text("level", { enum: ["beginner", "intermediate", "expert"] })
    .notNull()
    .default("beginner"),
  mechanic: text("mechanic", { enum: ["compound", "isolation"] }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Junction table for primary muscles
export const exercisePrimaryMuscles = sqliteTable("exercise_primary_muscles", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  muscleGroupId: text("muscle_group_id")
    .notNull()
    .references(() => muscleGroups.id, { onDelete: "cascade" }),
});

// Junction table for secondary muscles
export const exerciseSecondaryMuscles = sqliteTable(
  "exercise_secondary_muscles",
  {
    id: text("id").primaryKey(),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    muscleGroupId: text("muscle_group_id")
      .notNull()
      .references(() => muscleGroups.id, { onDelete: "cascade" }),
  },
);

// Exercise instructions (ordered list)
export const exerciseInstructions = sqliteTable("exercise_instructions", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  instruction: text("instruction").notNull(),
});

// Exercise images
export const exerciseImages = sqliteTable("exercise_images", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  path: text("path").notNull(), // File path relative to uploads directory
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type ExercisePrimaryMuscle = typeof exercisePrimaryMuscles.$inferSelect;
export type ExerciseSecondaryMuscle =
  typeof exerciseSecondaryMuscles.$inferSelect;
export type ExerciseInstruction = typeof exerciseInstructions.$inferSelect;
export type ExerciseImage = typeof exerciseImages.$inferSelect;
