import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findFirstExerciseImage: vi.fn(),
	findFirstWorkoutSession: vi.fn(),
	findManyWorkoutSetGroups: vi.fn(),
	findManyWorkoutSets: vi.fn(),
	findManyRoutineDays: vi.fn(),
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			exerciseImages: {
				findFirst: mocks.findFirstExerciseImage,
			},
			workoutSessions: {
				findFirst: mocks.findFirstWorkoutSession,
			},
			workoutSetGroups: {
				findMany: mocks.findManyWorkoutSetGroups,
			},
			workoutSets: {
				findMany: mocks.findManyWorkoutSets,
			},
			routineDays: {
				findMany: mocks.findManyRoutineDays,
			},
		},
	},
}));

import {
	getFirstExerciseImageUrl,
	getRoutineDaysWithWeekdays,
	getSessionWithData,
} from "./data-loaders";

describe("data-loaders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the first exercise image path when available", async () => {
		mocks.findFirstExerciseImage.mockResolvedValue({
			path: "/api/uploads/bench.webp",
		});

		await expect(getFirstExerciseImageUrl("exercise_123")).resolves.toBe(
			"/api/uploads/bench.webp",
		);
	});

	it("maps routine day weekdays into a flat array", async () => {
		mocks.findManyRoutineDays.mockResolvedValue([
			{
				id: "day_123",
				description: "Push",
				weekdays: [{ weekday: 1 }, { weekday: 3 }],
			},
		]);

		await expect(getRoutineDaysWithWeekdays("routine_123")).resolves.toEqual([
			{
				id: "day_123",
				description: "Push",
				weekdays: [1, 3],
			},
		]);
	});

	it("returns null when a session does not exist", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue(null);

		await expect(getSessionWithData("session_123")).resolves.toBeNull();
	});

	it("hydrates session sets with the first exercise image url", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			name: "Morning Workout",
		});
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{
				id: "group_123",
				order: 0,
			},
		]);
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_123",
				order: 0,
				exercise: {
					id: "exercise_123",
					name: "Bench Press",
				},
				repetitionUnit: null,
				weightUnit: null,
			},
		]);
		mocks.findFirstExerciseImage.mockResolvedValue({
			path: "/api/uploads/bench.webp",
		});

		await expect(getSessionWithData("session_123")).resolves.toEqual({
			id: "session_123",
			name: "Morning Workout",
			setGroups: [
				{
					id: "group_123",
					order: 0,
					sets: [
						{
							id: "set_123",
							order: 0,
							exercise: {
								id: "exercise_123",
								name: "Bench Press",
								imageUrl: "/api/uploads/bench.webp",
							},
							repetitionUnit: null,
							weightUnit: null,
						},
					],
				},
			],
		});
	});
});
