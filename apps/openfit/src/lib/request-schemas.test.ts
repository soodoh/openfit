import { describe, expect, it } from "vitest";
import {
	adminLookupMutationSchema,
	adminUserRoleUpdateSchema,
	createAdminExerciseSchema,
	createGymSchema,
	createRoutineDaySchema,
	createRoutineSchema,
	createSessionSchema,
	createSetGroupSchema,
	createSetSchema,
	createUserExerciseSchema,
	reorderSetGroupsSchema,
	reorderSetsSchema,
	replaceExerciseSchema,
	updateAdminExerciseSchema,
	updateGymSchema,
	updateRoutineDaySchema,
	updateRoutineSchema,
	updateSessionSchema,
	updateSetGroupSchema,
	updateSetSchema,
	updateUserExerciseSchema,
	updateUserProfileSchema,
} from "./request-schemas";

describe("adminUserRoleUpdateSchema", () => {
	it("accepts valid roles", () => {
		expect(adminUserRoleUpdateSchema.safeParse({ role: "ADMIN" }).success).toBe(
			true,
		);
	});

	it("rejects invalid roles", () => {
		expect(adminUserRoleUpdateSchema.safeParse({ role: "ROOT" }).success).toBe(
			false,
		);
	});
});

describe("updateUserProfileSchema", () => {
	it("accepts valid theme and default ids", () => {
		expect(
			updateUserProfileSchema.safeParse({
				theme: "dark",
				defaultGymId: "gym_123",
			}).success,
		).toBe(true);
	});

	it("rejects invalid theme values", () => {
		expect(
			updateUserProfileSchema.safeParse({ theme: "midnight" }).success,
		).toBe(false);
	});
});

describe("adminLookupMutationSchema", () => {
	it("accepts valid lookup mutations", () => {
		expect(
			adminLookupMutationSchema.safeParse({
				type: "equipment",
				name: "Kettlebell",
			}).success,
		).toBe(true);
	});

	it("rejects unknown lookup types", () => {
		expect(
			adminLookupMutationSchema.safeParse({
				type: "bad-type",
				name: "Whatever",
			}).success,
		).toBe(false);
	});
});

describe("gym schemas", () => {
	it("accepts gym creation payloads", () => {
		expect(
			createGymSchema.safeParse({
				name: "Garage Gym",
				equipmentIds: ["barbell", "rack"],
			}).success,
		).toBe(true);
	});

	it("rejects empty gym names on update", () => {
		expect(updateGymSchema.safeParse({ name: "" }).success).toBe(false);
	});
});

describe("routine schemas", () => {
	it("accepts routine creation payloads", () => {
		expect(
			createRoutineSchema.safeParse({
				name: "Push Day",
				description: "Chest, shoulders, triceps",
			}).success,
		).toBe(true);
	});

	it("rejects empty routine updates", () => {
		expect(updateRoutineSchema.safeParse({}).success).toBe(false);
	});
});

describe("routine day schemas", () => {
	it("accepts valid routine day payloads", () => {
		expect(
			createRoutineDaySchema.safeParse({
				routineId: "routine_123",
				description: "Upper body focus",
				weekdays: [1, 3, 5],
			}).success,
		).toBe(true);
	});

	it("rejects invalid weekdays", () => {
		expect(
			createRoutineDaySchema.safeParse({
				routineId: "routine_123",
				description: "Upper body focus",
				weekdays: [7],
			}).success,
		).toBe(false);
	});

	it("rejects empty routine day updates", () => {
		expect(updateRoutineDaySchema.safeParse({}).success).toBe(false);
	});
});

describe("exercise schemas", () => {
	it("accepts valid admin exercise payloads", () => {
		expect(
			createAdminExerciseSchema.safeParse({
				name: "Bench Press",
				level: "beginner",
				force: "push",
				mechanic: "compound",
				categoryId: "category_123",
				primaryMuscleIds: ["chest"],
				secondaryMuscleIds: ["triceps"],
				instructions: ["Lie on the bench", "Press the barbell upward"],
				imageUrls: ["/api/uploads/bench.webp"],
			}).success,
		).toBe(true);
	});

	it("rejects invalid admin exercise levels", () => {
		expect(
			createAdminExerciseSchema.safeParse({
				name: "Bench Press",
				level: "elite",
				categoryId: "category_123",
			}).success,
		).toBe(false);
	});

	it("accepts valid user exercise updates", () => {
		expect(
			updateUserExerciseSchema.safeParse({
				name: "Incline Bench Press",
				primaryMuscleIds: ["chest"],
			}).success,
		).toBe(true);
	});

	it("rejects empty exercise updates", () => {
		expect(updateAdminExerciseSchema.safeParse({}).success).toBe(false);
		expect(updateUserExerciseSchema.safeParse({}).success).toBe(false);
	});

	it("accepts valid user exercise creation payloads", () => {
		expect(
			createUserExerciseSchema.safeParse({
				name: "Push Up",
				categoryId: "category_123",
				instructions: ["Get into plank position"],
			}).success,
		).toBe(true);
	});
});

describe("session schemas", () => {
	it("accepts valid session creation payloads", () => {
		expect(
			createSessionSchema.safeParse({
				name: "Morning Workout",
				notes: "Felt good",
				startTime: Date.now(),
				endTime: Date.now() + 1_000,
				impression: 4,
				templateId: "routine_day_123",
			}).success,
		).toBe(true);
	});

	it("rejects out-of-range session ratings", () => {
		expect(
			createSessionSchema.safeParse({
				name: "Morning Workout",
				impression: 6,
			}).success,
		).toBe(false);
	});

	it("accepts valid session updates", () => {
		expect(
			updateSessionSchema.safeParse({
				notes: "Updated note",
				impression: 3,
			}).success,
		).toBe(true);
	});

	it("rejects empty session updates", () => {
		expect(updateSessionSchema.safeParse({}).success).toBe(false);
	});
});

describe("createSetGroupSchema", () => {
	it("requires either sessionId or routineDayId", () => {
		expect(
			createSetGroupSchema.safeParse({
				exerciseId: "exercise_123",
			}).success,
		).toBe(false);
	});

	it("rejects invalid set counts", () => {
		expect(
			createSetGroupSchema.safeParse({
				sessionId: "session_123",
				exerciseId: "exercise_123",
				numSets: 0,
			}).success,
		).toBe(false);
	});
});

describe("updateSetGroupSchema", () => {
	it("accepts valid group updates", () => {
		expect(
			updateSetGroupSchema.safeParse({
				type: "SUPERSET",
				comment: "Pair these exercises together",
			}).success,
		).toBe(true);
	});

	it("rejects empty payloads", () => {
		expect(updateSetGroupSchema.safeParse({}).success).toBe(false);
	});
});

describe("replaceExerciseSchema", () => {
	it("requires an exercise id", () => {
		expect(replaceExerciseSchema.safeParse({}).success).toBe(false);
	});
});

describe("createSetSchema", () => {
	it("accepts valid set payloads", () => {
		expect(
			createSetSchema.safeParse({
				setGroupId: "set_group_123",
				exerciseId: "exercise_123",
				type: "WARMUP",
				reps: 10,
				weight: 135,
				restTime: 90,
			}).success,
		).toBe(true);
	});

	it("rejects negative reps", () => {
		expect(
			createSetSchema.safeParse({
				setGroupId: "set_group_123",
				exerciseId: "exercise_123",
				reps: -1,
			}).success,
		).toBe(false);
	});
});

describe("updateSetSchema", () => {
	it("accepts valid set updates", () => {
		expect(
			updateSetSchema.safeParse({
				type: "DROPSET",
				completed: true,
			}).success,
		).toBe(true);
	});

	it("rejects empty set updates", () => {
		expect(updateSetSchema.safeParse({}).success).toBe(false);
	});
});

describe("reorder schemas", () => {
	it("requires at least one set group id", () => {
		expect(reorderSetGroupsSchema.safeParse({ setGroupIds: [] }).success).toBe(
			false,
		);
	});

	it("requires a parent set group id when reordering sets", () => {
		expect(reorderSetsSchema.safeParse({ setIds: ["set_123"] }).success).toBe(
			false,
		);
	});
});
