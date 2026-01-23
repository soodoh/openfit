import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Enum type definitions
const RoleEnum = v.union(v.literal("USER"), v.literal("ADMIN"));

const SetGroupTypeEnum = v.union(v.literal("NORMAL"), v.literal("SUPERSET"));

const SetTypeEnum = v.union(
  v.literal("NORMAL"),
  v.literal("WARMUP"),
  v.literal("DROPSET"),
  v.literal("FAILURE"),
);

const ExerciseForceEnum = v.union(
  v.literal("push"),
  v.literal("pull"),
  v.literal("static"),
);

const ExerciseLevelEnum = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("expert"),
);

const ExerciseMechanicEnum = v.union(
  v.literal("compound"),
  v.literal("isolation"),
);

const ThemeEnum = v.union(
  v.literal("light"),
  v.literal("dark"),
  v.literal("system"),
);

const AuthProviderTypeEnum = v.union(
  v.literal("google"),
  v.literal("github"),
  v.literal("facebook"),
  v.literal("discord"),
  v.literal("apple"),
  v.literal("microsoft"),
  v.literal("oidc"),
);

export default defineSchema({
  // Include Convex Auth tables
  ...authTables,

  // Auth providers configuration
  authProviders: defineTable({
    providerId: v.string(), // e.g., "google", "oidc-1"
    type: AuthProviderTypeEnum,
    displayName: v.string(), // Shown on login button
    enabled: v.boolean(),
    issuer: v.optional(v.string()), // For OIDC: https://auth.example.com
    iconUrl: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_providerId", ["providerId"])
    .index("by_enabled", ["enabled"]),

  // Extended user profile (links to Convex Auth users table)
  userProfiles: defineTable({
    userId: v.id("users"), // References Convex Auth users table
    role: RoleEnum,
    defaultRepetitionUnitId: v.id("repetitionUnits"),
    defaultWeightUnitId: v.id("weightUnits"),
    theme: ThemeEnum,
    defaultGymId: v.optional(v.id("gyms")),
  }).index("by_user", ["userId"]),

  gyms: defineTable({
    userId: v.id("users"),
    name: v.string(),
    equipmentIds: v.array(v.id("equipment")),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  repetitionUnits: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  weightUnits: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  equipment: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  muscleGroups: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  categories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  routines: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["userId"],
    }),

  routineDays: defineTable({
    routineId: v.id("routines"),
    userId: v.id("users"),
    weekdays: v.array(v.number()),
    description: v.string(),
    updatedAt: v.number(),
  })
    .index("by_routine", ["routineId"])
    .index("by_user", ["userId"])
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["userId"],
    }),

  workoutSessions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    notes: v.string(),
    impression: v.optional(v.number()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    templateId: v.optional(v.id("routineDays")),
  })
    .index("by_user", ["userId"])
    .index("by_user_start", ["userId", "startTime"])
    .index("by_template", ["templateId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["userId"],
    }),

  workoutSetGroups: defineTable({
    userId: v.id("users"),
    routineDayId: v.optional(v.id("routineDays")),
    sessionId: v.optional(v.id("workoutSessions")),
    type: SetGroupTypeEnum,
    order: v.number(),
    comment: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_routine_day", ["routineDayId", "order"])
    .index("by_session", ["sessionId", "order"])
    .index("by_user", ["userId"]),

  workoutSets: defineTable({
    userId: v.id("users"),
    setGroupId: v.id("workoutSetGroups"),
    exerciseId: v.id("exercises"),
    type: SetTypeEnum,
    order: v.number(),
    reps: v.number(),
    repetitionUnitId: v.id("repetitionUnits"),
    weight: v.number(),
    weightUnitId: v.id("weightUnits"),
    restTime: v.number(),
    completed: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_set_group", ["setGroupId", "order"])
    .index("by_exercise", ["exerciseId"])
    .index("by_user", ["userId"]),

  exercises: defineTable({
    name: v.string(),
    equipmentId: v.optional(v.id("equipment")),
    force: v.optional(ExerciseForceEnum),
    level: ExerciseLevelEnum,
    mechanic: v.optional(ExerciseMechanicEnum),
    primaryMuscleIds: v.array(v.id("muscleGroups")),
    secondaryMuscleIds: v.array(v.id("muscleGroups")),
    instructions: v.array(v.string()),
    categoryId: v.id("categories"),
    images: v.array(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_category", ["categoryId"])
    .index("by_equipment", ["equipmentId"])
    .searchIndex("search_exercise", {
      searchField: "name",
      filterFields: ["equipmentId", "level", "categoryId"],
    }),
});
