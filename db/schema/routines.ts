import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth";

export const routines = sqliteTable("routines", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const routineDays = sqliteTable("routine_days", {
  id: text("id").primaryKey(),
  routineId: text("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Junction table for routine day weekdays (0 = Sunday, 6 = Saturday)
export const routineDayWeekdays = sqliteTable("routine_day_weekdays", {
  id: text("id").primaryKey(),
  routineDayId: text("routine_day_id")
    .notNull()
    .references(() => routineDays.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0-6
});

export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert;
export type RoutineDay = typeof routineDays.$inferSelect;
export type NewRoutineDay = typeof routineDays.$inferInsert;
export type RoutineDayWeekday = typeof routineDayWeekdays.$inferSelect;
