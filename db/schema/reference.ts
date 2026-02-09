import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const repetitionUnits = sqliteTable("repetition_units", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const weightUnits = sqliteTable("weight_units", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const equipment = sqliteTable("equipment", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const muscleGroups = sqliteTable("muscle_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type RepetitionUnit = typeof repetitionUnits.$inferSelect;
export type NewRepetitionUnit = typeof repetitionUnits.$inferInsert;
export type WeightUnit = typeof weightUnits.$inferSelect;
export type NewWeightUnit = typeof weightUnits.$inferInsert;
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;
export type MuscleGroup = typeof muscleGroups.$inferSelect;
export type NewMuscleGroup = typeof muscleGroups.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
