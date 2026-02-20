import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { exercises } from "./exercises";
import { repetitionUnits, weightUnits } from "./reference";
import { routineDays } from "./routines";

// Set type enums
export const SetTypeEnum = {
  NORMAL: "NORMAL",
  WARMUP: "WARMUP",
  DROPSET: "DROPSET",
  FAILURE: "FAILURE",
} as const;
export type SetType = (typeof SetTypeEnum)[keyof typeof SetTypeEnum];

export const SetGroupTypeEnum = {
  NORMAL: "NORMAL",
  SUPERSET: "SUPERSET",
} as const;
export type SetGroupType =
  (typeof SetGroupTypeEnum)[keyof typeof SetGroupTypeEnum];

export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  notes: text("notes").notNull().default(""),
  impression: integer("impression"), // 1-5 rating
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),
  templateId: text("template_id").references(() => routineDays.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workoutSetGroups = sqliteTable("workout_set_groups", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  routineDayId: text("routine_day_id").references(() => routineDays.id, {
    onDelete: "cascade",
  }),
  sessionId: text("session_id").references(() => workoutSessions.id, {
    onDelete: "cascade",
  }),
  type: text("type", { enum: ["NORMAL", "SUPERSET"] })
    .notNull()
    .default("NORMAL"),
  order: integer("order").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  setGroupId: text("set_group_id")
    .notNull()
    .references(() => workoutSetGroups.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["NORMAL", "WARMUP", "DROPSET", "FAILURE"] })
    .notNull()
    .default("NORMAL"),
  order: integer("order").notNull(),
  reps: integer("reps").notNull().default(0),
  repetitionUnitId: text("repetition_unit_id")
    .notNull()
    .references(() => repetitionUnits.id),
  weight: integer("weight").notNull().default(0),
  weightUnitId: text("weight_unit_id")
    .notNull()
    .references(() => weightUnits.id),
  restTime: integer("rest_time").notNull().default(0), // seconds
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type WorkoutSetGroup = typeof workoutSetGroups.$inferSelect;
export type NewWorkoutSetGroup = typeof workoutSetGroups.$inferInsert;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type NewWorkoutSet = typeof workoutSets.$inferInsert;
