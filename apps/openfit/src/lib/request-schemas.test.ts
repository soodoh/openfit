import { describe, expect, it } from "vitest";
import {
	adminLookupMutationSchema,
	adminUserRoleUpdateSchema,
	createGymSchema,
	createRoutineDaySchema,
	createRoutineSchema,
	createSetGroupSchema,
	createSetSchema,
	reorderSetGroupsSchema,
	reorderSetsSchema,
	replaceExerciseSchema,
	updateGymSchema,
	updateRoutineDaySchema,
	updateRoutineSchema,
	updateSetGroupSchema,
	updateSetSchema,
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
