import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";
import { getAuthenticatedUserId } from "../lib/auth";

const RoleEnum = v.union(v.literal("USER"), v.literal("ADMIN"));

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

// ============ Equipment CRUD ============

export const createEquipment = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Equipment name is required");
    }

    // Check for duplicates
    const existing = await ctx.db
      .query("equipment")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing) {
      throw new Error("Equipment with this name already exists");
    }

    return await ctx.db.insert("equipment", { name });
  },
});

export const updateEquipment = mutation({
  args: { id: v.id("equipment"), name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Equipment name is required");
    }

    const equipment = await ctx.db.get(args.id);
    if (!equipment) {
      throw new Error("Equipment not found");
    }

    // Check for duplicates (exclude current)
    const existing = await ctx.db
      .query("equipment")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Equipment with this name already exists");
    }

    await ctx.db.patch(args.id, { name });
    return args.id;
  },
});

export const deleteEquipment = mutation({
  args: { id: v.id("equipment") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if used by exercises
    const usedByExercise = await ctx.db
      .query("exercises")
      .withIndex("by_equipment", (q) => q.eq("equipmentId", args.id))
      .first();

    if (usedByExercise) {
      throw new Error("Cannot delete equipment that is used by exercises");
    }

    // Check if used by gyms
    const gyms = await ctx.db.query("gyms").collect();
    const usedByGym = gyms.find((gym) => gym.equipmentIds.includes(args.id));

    if (usedByGym) {
      throw new Error("Cannot delete equipment that is used by gyms");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============ Muscle Groups CRUD ============

export const createMuscleGroup = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Muscle group name is required");
    }

    const existing = await ctx.db
      .query("muscleGroups")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing) {
      throw new Error("Muscle group with this name already exists");
    }

    return await ctx.db.insert("muscleGroups", { name });
  },
});

export const updateMuscleGroup = mutation({
  args: { id: v.id("muscleGroups"), name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Muscle group name is required");
    }

    const muscleGroup = await ctx.db.get(args.id);
    if (!muscleGroup) {
      throw new Error("Muscle group not found");
    }

    const existing = await ctx.db
      .query("muscleGroups")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Muscle group with this name already exists");
    }

    await ctx.db.patch(args.id, { name });
    return args.id;
  },
});

export const deleteMuscleGroup = mutation({
  args: { id: v.id("muscleGroups") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if used by exercises
    const exercises = await ctx.db.query("exercises").collect();
    const usedByExercise = exercises.find(
      (ex) =>
        ex.primaryMuscleIds.includes(args.id) ||
        ex.secondaryMuscleIds.includes(args.id),
    );

    if (usedByExercise) {
      throw new Error("Cannot delete muscle group that is used by exercises");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============ Categories CRUD ============

export const createCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Category name is required");
    }

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing) {
      throw new Error("Category with this name already exists");
    }

    return await ctx.db.insert("categories", { name });
  },
});

export const updateCategory = mutation({
  args: { id: v.id("categories"), name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Category name is required");
    }

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Category not found");
    }

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Category with this name already exists");
    }

    await ctx.db.patch(args.id, { name });
    return args.id;
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if used by exercises
    const usedByExercise = await ctx.db
      .query("exercises")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .first();

    if (usedByExercise) {
      throw new Error("Cannot delete category that is used by exercises");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============ Weight Units CRUD ============

export const createWeightUnit = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Weight unit name is required");
    }

    const existing = await ctx.db
      .query("weightUnits")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing) {
      throw new Error("Weight unit with this name already exists");
    }

    return await ctx.db.insert("weightUnits", { name });
  },
});

export const updateWeightUnit = mutation({
  args: { id: v.id("weightUnits"), name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Weight unit name is required");
    }

    const unit = await ctx.db.get(args.id);
    if (!unit) {
      throw new Error("Weight unit not found");
    }

    const existing = await ctx.db
      .query("weightUnits")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Weight unit with this name already exists");
    }

    await ctx.db.patch(args.id, { name });
    return args.id;
  },
});

export const deleteWeightUnit = mutation({
  args: { id: v.id("weightUnits") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if used by workout sets
    const usedBySets = await ctx.db
      .query("workoutSets")
      .filter((q) => q.eq(q.field("weightUnitId"), args.id))
      .first();

    if (usedBySets) {
      throw new Error("Cannot delete weight unit that is used by workout sets");
    }

    // Check if used as default by user profiles
    const usedByProfile = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("defaultWeightUnitId"), args.id))
      .first();

    if (usedByProfile) {
      throw new Error(
        "Cannot delete weight unit that is set as a user default",
      );
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============ Repetition Units CRUD ============

export const createRepetitionUnit = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Repetition unit name is required");
    }

    const existing = await ctx.db
      .query("repetitionUnits")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing) {
      throw new Error("Repetition unit with this name already exists");
    }

    return await ctx.db.insert("repetitionUnits", { name });
  },
});

export const updateRepetitionUnit = mutation({
  args: { id: v.id("repetitionUnits"), name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Repetition unit name is required");
    }

    const unit = await ctx.db.get(args.id);
    if (!unit) {
      throw new Error("Repetition unit not found");
    }

    const existing = await ctx.db
      .query("repetitionUnits")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Repetition unit with this name already exists");
    }

    await ctx.db.patch(args.id, { name });
    return args.id;
  },
});

export const deleteRepetitionUnit = mutation({
  args: { id: v.id("repetitionUnits") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if used by workout sets
    const usedBySets = await ctx.db
      .query("workoutSets")
      .filter((q) => q.eq(q.field("repetitionUnitId"), args.id))
      .first();

    if (usedBySets) {
      throw new Error(
        "Cannot delete repetition unit that is used by workout sets",
      );
    }

    // Check if used as default by user profiles
    const usedByProfile = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("defaultRepetitionUnitId"), args.id))
      .first();

    if (usedByProfile) {
      throw new Error(
        "Cannot delete repetition unit that is set as a user default",
      );
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============ Exercises CRUD ============

export const createExercise = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Exercise name is required");
    }

    // Check for duplicates
    const existing = await ctx.db
      .query("exercises")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing) {
      throw new Error("Exercise with this name already exists");
    }

    // Validate category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Validate equipment exists if provided
    if (args.equipmentId) {
      const equipment = await ctx.db.get(args.equipmentId);
      if (!equipment) {
        throw new Error("Equipment not found");
      }
    }

    return await ctx.db.insert("exercises", {
      name,
      equipmentId: args.equipmentId,
      force: args.force,
      level: args.level,
      mechanic: args.mechanic,
      primaryMuscleIds: args.primaryMuscleIds,
      secondaryMuscleIds: args.secondaryMuscleIds,
      instructions: args.instructions,
      categoryId: args.categoryId,
      images: args.images,
    });
  },
});

export const updateExercise = mutation({
  args: {
    id: v.id("exercises"),
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Exercise name is required");
    }

    const exercise = await ctx.db.get(args.id);
    if (!exercise) {
      throw new Error("Exercise not found");
    }

    // Check for duplicates (exclude current)
    const existing = await ctx.db
      .query("exercises")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Exercise with this name already exists");
    }

    await ctx.db.patch(args.id, {
      name,
      equipmentId: args.equipmentId,
      force: args.force,
      level: args.level,
      mechanic: args.mechanic,
      primaryMuscleIds: args.primaryMuscleIds,
      secondaryMuscleIds: args.secondaryMuscleIds,
      instructions: args.instructions,
      categoryId: args.categoryId,
      images: args.images,
    });

    return args.id;
  },
});

export const deleteExercise = mutation({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if used by workout sets
    const usedBySets = await ctx.db
      .query("workoutSets")
      .withIndex("by_exercise", (q) => q.eq("exerciseId", args.id))
      .first();

    if (usedBySets) {
      throw new Error("Cannot delete exercise that is used in workout sets");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ============ User Management ============

export const updateUserRole = mutation({
  args: {
    profileId: v.id("userProfiles"),
    role: RoleEnum,
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthenticatedUserId(ctx);
    await requireAdmin(ctx);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("User profile not found");
    }

    // Prevent removing own admin role
    if (profile.userId === currentUserId && args.role !== "ADMIN") {
      throw new Error("You cannot remove your own admin role");
    }

    await ctx.db.patch(args.profileId, { role: args.role });
    return args.profileId;
  },
});
