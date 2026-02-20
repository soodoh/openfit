import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth";
import { equipment, repetitionUnits, weightUnits } from "./reference";

// Role enum type
export const RoleEnum = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof RoleEnum)[keyof typeof RoleEnum];

// Theme enum type
export const ThemeEnum = {
  light: "light",
  dark: "dark",
  system: "system",
} as const;
export type Theme = (typeof ThemeEnum)[keyof typeof ThemeEnum];

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["USER", "ADMIN"] })
    .notNull()
    .default("USER"),
  defaultRepetitionUnitId: text("default_repetition_unit_id").references(
    () => repetitionUnits.id,
  ),
  defaultWeightUnitId: text("default_weight_unit_id").references(
    () => weightUnits.id,
  ),
  theme: text("theme", { enum: ["light", "dark", "system"] })
    .notNull()
    .default("system"),
  defaultGymId: text("default_gym_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const gyms = sqliteTable("gyms", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Junction table for gym equipment
export const gymEquipment = sqliteTable("gym_equipment", {
  id: text("id").primaryKey(),
  gymId: text("gym_id")
    .notNull()
    .references(() => gyms.id, { onDelete: "cascade" }),
  equipmentId: text("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type Gym = typeof gyms.$inferSelect;
export type NewGym = typeof gyms.$inferInsert;
export type GymEquipment = typeof gymEquipment.$inferSelect;
